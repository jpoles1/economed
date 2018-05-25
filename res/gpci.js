var gpciSetting;
function calcCost(costEntry, gpciEntry){
    if(costEntry.cost){
        return costEntry.cost.toFixed(2)
    }
    else if(costEntry["CONV FACTOR"] && costEntry["WORK RVU"] && costEntry["FACILITY PE RVU"] && costEntry["MP RVU"]){
        cost = costEntry["CONV FACTOR"] * ((costEntry["WORK RVU"] * gpciEntry["PW GPCI"]) + (costEntry["FACILITY PE RVU"] * gpciEntry["PE GPCI"]) + (costEntry["MP RVU"] * gpciEntry["MP GPCI"]))
        return cost.toFixed(2)
    }
    console.log("Error calculating cost for:", costEntry)
    return 0
}
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
    $(".cost-input-box > .awesomplete > .dropdown-input").each(function (_) {
        costName = $(this).val();
        if(costName.length > 0){
            urlArray.push(costName)
        }
    })
    urlString = urlArray.join(",")
    console.log(urlArray, urlString)
    console.log(encodeURI(urlString))
    window.location.hash = encodeURI(urlString)
    baseURL = window.location.href.split('?')[0];
    //history.pushState(null, null, baseURL + "?interventions="+encodeURIComponent(urlString));
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
                $("#care-list").children(".cost-input").last().children(".cost-value").children(".cost-number").html(calcCost(costData[entry], gpciSetting))
            }
        })
        sumCosts()
    }
}
function updateCosts(costData){
    $(".cost-input-box > .awesomplete > .dropdown-input").each(function (_) {
        costName = $(this).val();
        $(this).parent().parent().parent().children(".cost-value").children(".cost-number").html(calcCost(costData[costName], gpciSetting))
    })
    sumCosts()
}
function initializeLocaleInput(gpci_data, costData) {
    console.log(gpci_data)
    var localeInput = $("#locale-selector")
    var btn = localeInput.siblings("button").first();
    var comboplete = new Awesomplete(localeInput[0], {
        minChars: 0,
        autoFirst: false,
        list: Object.keys(gpci_data),
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
    Awesomplete.$(localeInput[0]).addEventListener("awesomplete-selectcomplete", function () {
        gpciSetting = gpci_data[inputValue = $(this).val()]
        updateCosts(costData)
    })
}
function initializeCostInput(costData) {
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
            $(this).parents(".cost-input").children(".cost-value").children(".cost-number").html(calcCost(costData[inputValue], gpciSetting))
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
    initializeCostInput(costData)
    activateDeleteButtons(costData)
}

$(function () {
    var costData;
    if (window.matchMedia('(display-mode: standalone)').matches) {
        $("#url-box").parent().show()
    }
    updateURLBox()
    $("#url-box, #locale-selector").focus(function(){ 
        $(this).select(); 
    });
    $("#care-list").append($("#cost-input-template").html())
    $.getJSON("labs.json", function (labs_costs) {
        $.getJSON("gpci.json", function (gpci_data) {
            $.getJSON("rvu_costs.json", function (rvu_costs) {
                gpciSetting = gpci_data[Object.keys(gpci_data)[0]]
                costData = Object.assign({}, labs_costs, rvu_costs);
                loadURLConfig(costData)
                initializeLocaleInput(gpci_data, costData)
                initializeCostInput(costData)
                activateDeleteButtons(costData)    
            })
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