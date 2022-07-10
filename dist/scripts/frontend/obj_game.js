import { word_list } from "./word_list.js"

export const gameObject = {
    latest:[],
    player_names:[],
    whos_turn:-1,
    id:"",

    list() {
        const home_yourturn_list = document.getElementById('home_yourturn_list')
        const home_waiting_list = document.getElementById('home_waiting_list')

        let currentPlayerName = localStorage.draw_user

        let containerwithx = document.createElement('div')

        let container = document.createElement('div')
        container.id = this.id
        container.classList.add('home_game')
        if (this.whos_turn == 0) {
            container.innerHTML = "<span style='font-weight:700;'>"+this.player_names[0]+"</span> vs "+this.player_names[1]
        } else {
            container.innerHTML = this.player_names[0]+" vs <span style='font-weight:700;'>"+this.player_names[1]+"</span>"
        }    
        let touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click';
        let deleteX = document.createElement('button')
        deleteX.classList.add('deleteGameButton')
        deleteX.innerHTML = "Delete"
        deleteX.addEventListener(touchEvent, async function() {
            const response = await fetch('/api/game/'+container.id+'/delete')
            const data = await response.json() 
            if (data.status == 'ok') {
                containerwithx.innerHTML = ""
            } else {
                alert(data)
            }
        })
        containerwithx.append(container, deleteX)

        if (this.player_names[this.whos_turn] == currentPlayerName) {

            container.addEventListener(touchEvent, function() {
                window.location.href = '/game/'+container.id
            })
            home_yourturn_list.append(containerwithx)
        } else {
            home_waiting_list.append(containerwithx)
        }
        
    },
    display() {
        let currentPlayerName = localStorage.draw_user
        let touchEvent = 'ontouchstart' in window ? 'touchstart' : 'click';
        let drawing_submit = document.getElementById("drawing-submit")
        const info = document.getElementById('info')

        if (this.player_names[this.whos_turn] == currentPlayerName) {
            const image = document.getElementById("image")
            const guess = document.getElementById("guess")
            const canvas = document.getElementById('drawing-area')
            const newwords = document.getElementById('newwords')
            
            canvas.dataset.gameid = this.id
    
            if (this.latest.length != 3) {
                console.log(this.latest.length)
                // no latest image, pick word state
                let modal = document.getElementById('modal')
                let choices = []
                if (localStorage.draw_temp_choices == null || localStorage.draw_temp_choices == "null") {
                    choices = returnRandomWords()
                    localStorage.draw_temp_choices = choices
                } else {
                    choices = localStorage.draw_temp_choices.replaceAll('[','').replaceAll(']','').split(',')
                }

                
                modal.style.display = 'flex'

                for (let i=0;i<modal.children.length-1;i++) {
                    modal.children[i].innerHTML = choices[i] + " ("+(i+1)+" coins)"
                    modal.children[i].addEventListener(touchEvent, function() {
                        // word chosen, close modal, and store locally to be used in the submit call
                        localStorage.setItem('draw_temp_chosenword', modal.children[i].innerHTML.split(' (')[0])
                        localStorage.setItem('draw_temp_points', i+1)
                        modal.style.display = 'none'
                        init_canvas()
                        canvas.style.display = 'block'
                        info.innerHTML = "Draw <span style='font-weight:700;'>"+localStorage.draw_temp_chosenword+"</span>"
                    })
                    newwords.addEventListener('click', async function() {
                        
                        if (parseInt(document.getElementById('currentScore').innerText) >= 5) {
                            localStorage.draw_temp_choices = null
                            await awardPoints(localStorage.draw_user, -5)
                            window.location.reload()
                        }
                    })
                }
                
                drawing_submit.style.display = ''
                drawing_submit.addEventListener(touchEvent, async function() {
                    localStorage.draw_temp_choices = null
                    var image = canvas.toDataURL("image/png")
                    let body = {
                        data:[
                            localStorage.draw_temp_chosenword, 
                            localStorage.draw_temp_points,
                            image
                        ]
                    }
                    
                    const fetchResponse = await fetch('/api/game/'+canvas.dataset.gameid+'/updatelatest', {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                            },
                        method: 'POST',
                        body: JSON.stringify(body)
                    }); 
                    await changeTurn(canvas.dataset.gameid)
                    window.location.reload()
                })
                
                // only change turn after finishing drawing
                // changeTurn(image.dataset.gameID)
            } else {
                // guessing state
                canvas.style.display = 'none'
                image.style.display = ''
                guess.style.display = ''
                image.dataset.value = this.latest[0]
                image.dataset.points = this.latest[1]
                image.src = this.latest[2]
                image.dataset.gameID = this.id
                info.innerHTML = 'Find the '+(image.dataset.value.length)+" letter word with these letters:<br/>"+scramble(image.dataset.value)
                guess.addEventListener('keydown', async function(e) {
                    if (e.key == "Enter" && guess.value.length > 0) {
                        if (guess.value.toLowerCase() == image.dataset.value.toLowerCase()) {
                            guess.setAttribute('placeholder', '')
                            await awardPoints("", parseInt(image.dataset.points), image.dataset.gameID)
                            await finishGuessing(image.dataset.gameID)
                            window.location.reload()
                        } else {
                            guess.value = ""
                            guess.setAttribute('placeholder', 'Incorrect')
    
                        }
                    }
                })
            }
        } else {
            window.location.href = '/'
        }
        

    }
}

async function awardPoints(user, points, game) {
    if (user.length < 1) {
        const response = await fetch('/api/awardall/'+game+"/"+points)
    } else {
        const response = await fetch('/api/award/'+user+"/"+points)
    }

    
}

async function changeTurn(gameID) {
    const response = await fetch('/api/game/'+gameID+'/changeturn' )
}

async function finishGuessing(gameID) {
    const response = await fetch('/api/game/'+gameID+'/finishguessing')
}

function returnRandomWords() {
    let x = []
    while (x.length < 3) {
        x.push(word_list[Math.floor(Math.random() * word_list.length)])
    }
    return x
}

function scramble(x) {
    let scrambled = ""
    x = x.split('')
    scrambled = (x.sort((a, b) => 0.5 - Math.random())).join().replaceAll(',','').toUpperCase()
    return scrambled
}

// CANVAS CODE

let canvas, canvasContext
const state = {
    mousedown: false
};
    
let lineWidth = 5;
let fillStyle = '#333';
let strokeStyle = '#333';
let shadowColor = '#333';

function init_canvas() {
    canvas = document.getElementById('drawing-area');
    canvas.style.display = 'none'

    canvasContext = canvas.getContext('2d');
    canvasContext.canvas.width = window.innerWidth * 0.9
    canvasContext.canvas.height = window.innerHeight * 0.5
    canvasContext.fillStyle = "white"
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    
    canvas.addEventListener('mousedown', handleWritingStart);
    canvas.addEventListener('mousemove', handleWritingInProgress);
    canvas.addEventListener('mouseup', handleDrawingEnd);
    canvas.addEventListener('mouseout', handleDrawingEnd);
    
    canvas.addEventListener('touchstart', handleWritingStart);
    canvas.addEventListener('touchmove', handleWritingInProgress);
    canvas.addEventListener('touchend', handleDrawingEnd);

    const color_picker = document.getElementById("color_picker")
    color_picker.style.display = 'block'
    strokeStyle = color_picker.value
    color_picker.addEventListener('change', function() {
        strokeStyle = color_picker.value
    })
    const width_picker = document.getElementById("width_picker")
    width_picker.style.display = 'block'
    lineWidth = width_picker.value
    width_picker.addEventListener('change', function() {
        lineWidth = width_picker.value
    })
    const clear = document.getElementById("drawing-clear")
    clear.style.display = ''
    clear.onclick = function() {
        clearCanvas()
    }
}

function handleWritingStart(event) {
  event.preventDefault();

  const mousePos = getMosuePositionOnCanvas(event);
  
  canvasContext.beginPath();

  canvasContext.moveTo(mousePos.x, mousePos.y);

  canvasContext.lineWidth = lineWidth;
  canvasContext.strokeStyle = strokeStyle;
  canvasContext.shadowColor = null;

  canvasContext.fill();
  
  state.mousedown = true;
}

function handleWritingInProgress(event) {
  event.preventDefault();
  
  if (state.mousedown) {
    const mousePos = getMosuePositionOnCanvas(event);

    canvasContext.lineTo(mousePos.x, mousePos.y);
    canvasContext.stroke();
  }
}

function handleDrawingEnd(event) {
  event.preventDefault();
  
  if (state.mousedown) {
    canvasContext.shadowColor = shadowColor;

    canvasContext.stroke();
  }
  
  state.mousedown = false;
}

function getMosuePositionOnCanvas(event) {
  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;
  const { offsetLeft, offsetTop } = event.target;
  const canvasX = clientX - offsetLeft;
  const canvasY = clientY - offsetTop;

  return { x: canvasX, y: canvasY };
}

function clearCanvas() {
    canvasContext.fillStyle = "white"
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

}