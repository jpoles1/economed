function sumCosts() {
    var totalCost = 0.0
    $(".cost-value > .cost-number").each(function (_, entry) {
        cellValue = parseFloat($(entry).html())
        if (!isNaN(cellValue)) {
            totalCost += cellValue
        }
    })
    $(".cost-total").html("$ " + totalCost.toFixed(2));
}

function generateURL() {
    urlArray = []
    $(".cost-input-box > .dropdown-input").each(function (_) {
        costName = $(this).val();
        if(costName.length > 0){
            urlArray.push(costName)
        }
    })
    urlString = urlArray.join(",")
    console.log(urlArray, urlString)
    console.log(encodeURI(urlString))
    window.location.hash = encodeURI(urlString)
    updateURLBox()
}
function updateURLBox(){
    $("#url-box").val(window.location)
}

function loadURLConfig(costData) {
    urlString = decodeURI(window.location.hash)
    if (urlString.length > 0) {
        urlString = urlString.split('#')[1]
        first = 1;
        $(urlString.split(",")).each(function (_, entry) {
            if (Object.keys(costData).includes(entry)) {
                if (!first) {
                    $("#care-list").append($("#cost-input-template").html())
                } else {
                    first = 0
                }
                $("#care-list").children(".cost-input").last().children(".cost-input-box").children("input").val(entry)
                $("#care-list").children(".cost-input").last().children(".cost-value").children(".cost-number").html(costData[entry].cost.toFixed(2))
            }
        })
        sumCosts()
    }
}

function initializeAutocompleteTextbox(costData) {
    $(".cost-input-box > .dropdown-input").each(function (_, entry) {
        var btn = $(entry).siblings("button").first();
        var comboplete = new Awesomplete(entry, {
            minChars: 2,
            autoFirst: true,
            list: Object.keys(costData),
            maxItems: 500
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
            $(this).parents(".cost-input").children(".cost-value").children(".cost-number").html(costData[inputValue].cost.toFixed(2))
            sumCosts()
            generateURL()
        })

    })
}

function activateDeleteButtons(costData){
    $(".delete-btn").click(function () {
        $(this).parents("tr").remove()
        sumCosts()
        generateURL()
        if ($(".cost-value").length < 1) {
            addCostEntry(costData)
        }
    })
}
function addCostEntry(costData) {
    $("#care-list").append($("#cost-input-template").html())
    initializeAutocompleteTextbox(costData)
    activateDeleteButtons(costData)
}

$(function () {
    var costData;
    if (window.matchMedia('(display-mode: standalone)').matches) {
        $("#url-box").parent().show()
    }
    updateURLBox()
    $("#url-box").focus(function(){ 
        $(this).select(); 
    });
    $("#care-list").append($("#cost-input-template").html())
    $.getJSON("labs.json", function (labs_costs) {
        $.getJSON("manhattan_costs.json", function (rvu_costs) {
            costData = Object.assign({}, labs_costs, rvu_costs);
            loadURLConfig(costData)
            initializeAutocompleteTextbox(costData)
            activateDeleteButtons(costData)    
        })
    })
    $("#add-cost").click(function () {
        addCostEntry(costData)
        return false
    })
    var addtohome = addToHomescreen({
        autostart: false,
        modal: true,
        skipFirstVisit: true,
        maxDisplayCount: 2,
        startDelay: 0,
        debug: true
    });
    $("#add-to-homescreen-link").click(function(e){
        e.preventDefault()
        addtohome.show(true)
        return false;
    })
    $("#lit-link").click(function(e){
        $("#literature-review").slideToggle()
        e.preventDefault()
        return false;
    })
})