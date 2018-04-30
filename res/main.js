function sumCosts() {
    var totalCost = 0.0
    $(".cost-value > .cost-number").each(function (_, entry) {
        cellValue = parseFloat($(entry).html())
        if (!isNaN(cellValue)) {
            totalCost += cellValue
        }
    })
    $(".cost-total").html("Total Cost: $" + totalCost.toFixed(2));
}

function generateURL() {
    urlArray = []
    $(".dropdown-input").each(function (_, entry) {
        urlArray.push($(this).val())
    })
    urlString = urlArray.join(",")
    console.log(urlArray, urlString)
    console.log(encodeURI(urlString))
    window.location.hash = encodeURI(urlString)
}

function loadURLConfig(costData) {
    urlString = decodeURI(window.location.hash)
    if(urlString.length > 0){
        urlString = urlString.split('#')[1]
        first = 1;
        $(urlString.split(",")).each(function (_, entry) {
            if(Object.keys(costData).includes(entry)){
                if (!first) {
                    $("#cost-list").append($("#cost-input-template").html())
                } else {
                    first = 0
                }
                $("#cost-list").children(".cost-input").last().children(".cost-input-box").children("input").val(entry)
                $("#cost-list").children(".cost-input").last().children(".cost-value").children(".cost-number").html(costData[entry].cost)    
            }
        })
    }
}

function initializeAutocompleteTextbox(costData) {
    $(".dropdown-input").each(function (_, entry) {
        var btn = $(entry).siblings("button").first();
        var comboplete = new Awesomplete(entry, {
            minChars: 0,
            list: Object.keys(costData)
        });
        $(btn).click(function () {
            if (comboplete.ul.childNodes.length === 0) {
                comboplete.minChars = 0;
                comboplete.evaluate();
            } else if (comboplete.ul.hasAttribute('hidden')) {
                comboplete.open();
            } else {
                comboplete.close();
            }
        });
        Awesomplete.$(entry).addEventListener("awesomplete-selectcomplete", function () {
            inputValue = $(this).val()
            $(this).parents(".cost-input").children(".cost-value").children(".cost-number").html(costData[inputValue].cost)
            sumCosts()
            generateURL()
        })

    })
}

$(function () {
    var costData;
    $("#cost-list").append($("#cost-input-template").html())
    $.getJSON("labs.json", function (data) {
        costData = data;
        loadURLConfig(costData)
        initializeAutocompleteTextbox(costData)
    })
    $("#add-cost").click(function () {
        $("#cost-list").append($("#cost-input-template").html())
        initializeAutocompleteTextbox(costData)
        return false
    })
})