$(function(){
    var acc = document.getElementsByClassName("accordion");
    var i;
    for (i = 0; i < acc.length; i++) {
      acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = $(this).nextAll(".panel").eq(0);
        $(panel).slideToggle()
        console.log(panel)
      });
    }
})