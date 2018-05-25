var gpciSetting;

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}

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
    interventionArray = []
    $(".cost-input-box > .awesomplete > .dropdown-input").each(function (_) {
        costName = $(this).val();
        if(costName.length > 0){
            interventionArray.push(costName)
        }
    })
    interventionString = encodeURIComponent(interventionArray.join(","))
    localeString = encodeURIComponent($("#locale-selector").val())
    baseURL = window.location.href.split('?')[0];
    //Can switch to using history.pushState 
    //though this may cause some issues w/ forward + back navigation and updating of data 
    history.replaceState(null, null, baseURL + "?locale=" + localeString + "&interventions="+interventionString);
    updateURLBox()
}
function updateURLBox(){
    $("#url-box").val(window.location)
}

function urlLocale(gpci_data) {
    urlString = $.urlParam("locale")    
    if(urlString){
        urlString = decodeURIComponent(urlString)
        if(Object.keys(gpci_data).includes(urlString)){
            $("#locale-selector").val(urlString)
            gpciSetting = gpci_data[urlString]        
        }
    }
    gpciSetting = gpci_data[$("#locale-selector").val()]
}

function urlInterventions(costData) {
    //Load in interventions
    urlString = $.urlParam("interventions")
    if(!urlString) return
    urlString = decodeURIComponent(urlString)
    if (urlString.length > 0) {
        console.log(urlString)
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
        if (Object.keys(costData).includes(costName)) {
            $(this).parent().parent().parent().children(".cost-value").children(".cost-number").html(calcCost(costData[costName], gpciSetting))
        }
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
        gpciSetting = gpci_data[$(this).val()]
        updateCosts(costData)
        generateURL()
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
                urlLocale(gpci_data)
                urlInterventions(costData)
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