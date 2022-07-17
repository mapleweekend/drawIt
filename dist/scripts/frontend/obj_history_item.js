export const historyItemObject = {
    word:"",
    points_awarded:-1,
    img_data:"",
    attempts:[],
    comments:[],
    drawn_by:"",
    index:-1,

    display() {
        const container = document.createElement("div")
        container.dataset.index = this.index
        container.classList.add('history_container')
        container.innerHTML += "<span style='font-weight:700'>"+this.drawn_by + "</span> drew <span style='font-weight:700;color:red;'>" + this.word + "</span> for <span style='font-weight:700;color:blue;'>"+this.points_awarded + " coins</span><br/>"
        container.innerHTML += "<img src='"+this.img_data+"'>"
        container.innerHTML += "<br/>Comments<br/>"
        const commentContainer = document.createElement("div")
        for (let i=0;i<this.comments.length;i++) {
            let c = this.comments[i]
            commentContainer.innerHTML += "<span style='font-weight:700;'>" +c.split(': ')[0] + "</span>: "+c.split(': ')[1] + "<br/>"
        }
        const commentInput = document.createElement('input')
        commentInput.maxLength = "80"
        

        commentInput.addEventListener('keydown', function(e) {
            if (e.key == "Enter" && commentInput.value.length > 0) {
                comment(container.dataset.index, commentInput.value)
                commentContainer.innerHTML += "<span style='font-weight:700;'>" +localStorage.draw_user + "</span>: "+commentInput.value + "<br/>"
                commentInput.value = ""
            }
        })

        container.append(commentContainer,commentInput)

        document.querySelector('.history_area').append(container)
    }
}

async function comment(index, comment) {
    const response = await fetch('/api/historyComment/'+window.location.pathname.split('/history/')[1]+"/"+index+"/"+localStorage.draw_user+"/"+comment)
}