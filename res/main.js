var gpciSetting, low_value_cpt

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}
function initValueTooltip(element){
    tippy(element, {
        arrow: true,
        interactive: true,
        hideOnClick: false,
        dynamicTitle: true,        
    })
}

function calcInpatientCost(costEntry){
    return costEntry["Average Medicare Payments"].toFixed(2)
}
function calcOutpatientCost(costEntry, gpciEntry){
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

//Calculate the cost of the care plan for a medicare outpatient
function outpatientPricetag(element, totalCost) {
    const medicareDeductible = 183
    var deductibleCost = Math.min(totalCost, medicareDeductible);
    deductibleCost = deductibleCost.toFixed(2)
    var copay = totalCost >  medicareDeductible ? (totalCost - 183) * .2 : 0
    copay = copay.toFixed(2)
    $(element).find(".patient-costs").html("$" + deductibleCost + " annual deductible<br>+<br>$" + copay + " copay")
}
function sumCosts(element) {
    var totalCost = 0.0
    $(element).find(".cost-value > .cost-number").each(function (_, entry) {
        cellValue = parseFloat($(entry).html())
        if (!isNaN(cellValue)) {
            totalCost += cellValue
        }
    })
    totalCost = totalCost.toFixed(2)
    $(element).find(".cost-total").html("$ " + totalCost);
    outpatientPricetag(element, totalCost)
    return totalCost
}

function generateURL() {
    generateInterventionArray = function(element){
        interventionArray = []
        $(element).find(".cost-input-box > .awesomplete > .dropdown-input").each(function (_) {
            costName = $(this).val();
            if(costName.length > 0){
                interventionArray.push(costName)
            }
        })
        return interventionArray   
    }
    outpatientString = encodeURIComponent(generateInterventionArray("#outpatient-panel").join(","))
    inpatientString = encodeURIComponent(generateInterventionArray("#inpatient-panel").join(","))
    pharmaString = encodeURIComponent(generateInterventionArray("#pharma-panel").join(","))
    localeString = encodeURIComponent($("#locale-selector").val())
    baseURL = window.location.href.split('?')[0];
    //Can switch to using history.pushState 
    //though this may cause some issues w/ forward + back navigation and updating of data
    newURL = baseURL + "?locale=" + localeString + "&outpatient=" + outpatientString + "&inpatient=" + inpatientString + "&pharma=" + pharmaString;
    if(newURL != window.location){
        history.pushState(null, null, newURL);
    }
    updateURLBox()
}
function updateURLBox(){
    $(".url-box").val(window.location)
}

function urlLocale(gpci_data) {
    urlString = $.urlParam("locale")    
    if(urlString){
        urlString = decodeURIComponent(urlString)
        if(Object.keys(gpci_data).indexOf(urlString) > -1){
            $("#locale-selector").val(urlString)
            gpciSetting = gpci_data[urlString]        
        }
    }
    gpciSetting = gpci_data[$("#locale-selector").val()]
}

function urlInterventions(urlParam, element, costFunction, costData) {
    //Load in interventions
    urlString = $.urlParam(urlParam)
    if(!urlString){
        addCostEntry(element, costFunction, costData)
        updateCosts(element, costFunction, costData)
        outpatientPricetag(element, sumCosts(element))
        return
    }
    urlString = decodeURIComponent(urlString)
    if (urlString.length > 0) {
        $(urlString.split(",")).each(function (_, entry) {
            if (Object.keys(costData).indexOf(entry) > -1) {
                $(element).find(".care-list").append($(element).find(".cost-input-template").html())
                $(element).find(".care-list").children(".cost-input").last().children(".cost-input-box").children("input").val(entry)
            }
        })
    }
    updateCosts(element, costFunction, costData)
    outpatientPricetag(element, sumCosts(element))
    $(element).slideDown()
    $(element).find(".low-value-tooltip").each(function(_, entry){
        initValueTooltip(entry)
    })
}
function updateCosts(element, costFunction, costData){
    $(element).find(".cost-input-box").find(".dropdown-input").each(function (_) {
        costName = $(this).val();
        low_value_indicator = $(this).parents(".cost-input").find(".low-value-warning")
        low_value_tooltip = $(this).parents(".cost-input").find(".low-value-tooltip")
        if (Object.keys(costData).indexOf(costName) > -1) {
            $(this).parents(".cost-input").find(".cost-number").html(costFunction(costData[costName]))
            if(costData[costName]["HCPCS"]){
                var hcpcs_code = costData[costName]["HCPCS"]
                if(Object.keys(low_value_cpt).indexOf(hcpcs_code) > -1){
                    var qual_string = low_value_cpt[hcpcs_code]["Qualifications"].replace(";", "<hr>")
                    var reference_url = "https://jamanetwork.com/journals/jamainternalmedicine/fullarticle/2442504"
                    var tooltip_string = "<a target='_blank' href="+reference_url+">Literature suggests that this might be a low value code if used for:</a><hr>" + qual_string + "<hr>"
                    $(low_value_tooltip).attr("title", tooltip_string)
                    $(low_value_indicator).show()
                    $(low_value_tooltip).show()
                    $(this).addClass("warn-code")
                }
                else{
                    $(low_value_indicator).hide()    
                    $(low_value_tooltip).hide()   
                    $(this).removeClass("warn-code") 
                }
            }
        }
    })
    sumCosts(element)
}
function initializeLocaleInput(element, costFunction, gpci_data, costData) {
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
        updateCosts(element, costFunction, costData)
        generateURL()
    })
}
function initializeCostInput(element, costFunction, costData) {
    $(element).find(".cost-input-box > .dropdown-input").each(function (_, entry) { 
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
            updateCosts(element, costFunction, costData)
            sumCosts(element)
            generateURL()
        })
    })
}

function activateDeleteButtons(element, costFunction, costData){
    $(".delete-btn").click(function () {
        $(this).parents("tr").remove()
        sumCosts(element)
        generateURL()
        if ($(element).find(".cost-value").length < 1) {
            addCostEntry(element, costFunction, costData)
        }
    })
}
function addCostEntry(element, costFunction, costData) {
    var new_entry = $(element).find(".care-list").append($(element).find(".cost-input-template").html())
    initializeCostInput(element, costFunction, costData)
    activateDeleteButtons(element, costFunction, costData)
    initValueTooltip($(new_entry).children(".cost-input").last().find(".low-value-tooltip")[0])
    $(new_entry).find(".dropdown-input").focus()
}

$(function () {
    //Watch for changes to page forward/back and refresh
    $(window).on('popstate', function() {
        location.reload(true);
    });
    $(".panel").hide()
    if (window.matchMedia('(display-mode: standalone)').matches) {
        $(".url-box").parent().show()
    }
    updateURLBox()
    $(".url-box, #locale-selector").focus(function(){ 
        $(this).select(); 
    });
    var labs_costs, gpci_data, rvu_costs, drg_avg_costs, pharma_costs
    $.when(
        $.getJSON("labs.json", function(data) {
            labs_costs = data;
        }),
        $.getJSON("gpci.json", function(data) {
            gpci_data = data;
        }),
        $.getJSON("rvu_costs.json", function(data) {
            rvu_costs = data;
        }),
        $.getJSON("drg_avg_costs.json", function(data) {
            drg_avg_costs = data;
        }),
        $.getJSON("drug_costs.json", function(data) {
            pharma_costs = data;
        }),
        $.getJSON("low_value.json", function(data) {
            low_value_cpt = data;
        })
    ).then(function() {
        gpciSetting = gpci_data[Object.keys(gpci_data)[0]]
        outpatient_costs = $.extend({}, labs_costs, rvu_costs);
        urlLocale(gpci_data)
        
        _calcOutpatientCost = function(costEntry){
            return calcOutpatientCost(costEntry, gpciSetting)
        }

        urlInterventions("outpatient", "#outpatient-panel", _calcOutpatientCost, outpatient_costs)
        urlInterventions("inpatient", "#inpatient-panel", calcInpatientCost, drg_avg_costs)
        urlInterventions("pharma", "#pharma-panel", _calcOutpatientCost, pharma_costs)

        initializeLocaleInput("#outpatient-panel", _calcOutpatientCost, gpci_data, outpatient_costs)
       
        initializeCostInput("#outpatient-panel", _calcOutpatientCost, outpatient_costs)
        initializeCostInput("#inpatient-panel", calcInpatientCost, drg_avg_costs)
        initializeCostInput("#pharma-panel", _calcOutpatientCost, pharma_costs)
       
        activateDeleteButtons("#outpatient-panel", _calcOutpatientCost, outpatient_costs)
        activateDeleteButtons("#inpatient-panel", calcInpatientCost, drg_avg_costs)
        activateDeleteButtons("#pharma-panel", _calcOutpatientCost, pharma_costs)

        $("#outpatient-panel").find(".add-cost").click(function () {
            addCostEntry($(this).parents(".panel"), _calcOutpatientCost, outpatient_costs)
            return false
        })
        $("#inpatient-panel").find(".add-cost").click(function () {
            addCostEntry($(this).parents(".panel"), calcInpatientCost, drg_avg_costs)
            return false
        })
        $("#pharma-panel").find(".add-cost").click(function () {
            addCostEntry($(this).parents(".panel"), _calcOutpatientCost, pharma_costs)
            return false
        })
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