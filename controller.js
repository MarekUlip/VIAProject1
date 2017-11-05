var dateStart;
var dateEnd;
var pickerStart;
var chart = null;
var options = {
    title: 'Bitcoin history',
    legend: { position: 'bottom' },
    series: {
        0: { color: '#f57f17' },
    },
    hAxis: {
        title: 'Date'
    },
    vAxis: {
        title: '$'
    }
  };
var testResp;
var bitconinHistoryArr = null;
var currencyValues = null;
var isMenuOpened = false;
var isSmallScreen = false;
window.onload = function(){
    init();
};

window.addEventListener('resize',
 function(){
     if(window.innerWidth>1001){
        document.getElementById("main-menu-list").style.display = "block";
        isMenuOpened= true;
        isSmallScreen = false;
    }else{
        document.getElementById("main-menu-list").style.display = "none";
        isMenuOpened= false;
        isSmallScreen = true;
    }
    if(chart != null){
    drawChart();
    }
},
true);

/*window.onresize = function(event) {
    if(chart != null){
        drawChart();
    }
};*/


function init(){
    if(window.innerWidth>1001)isSmallScreen = false;
    if(localStorage["currencies"] == null)initCurrencies();
    else initCurrencySelect();
    initDatePickers();
    initChart();
    openBitcoinTrend();
}

function initCurrencies(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            localStorage["currencies"] = JSON.stringify(Object.keys(JSON.parse(xmlHttp.responseText)));
            initCurrencySelect();
        }
    }
    xmlHttp.open("GET", "https://blockchain.info/ticker?cors=true", true); // true for asynchronous 
    xmlHttp.send(null);   
}

function loadCurrencyValues(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            currencyValues = JSON.parse(xmlHttp.responseText);
        }
    }
    xmlHttp.open("GET", "https://blockchain.info/ticker?cors=true", true); // true for asynchronous 
    xmlHttp.send(null);   
}

function initCurrencySelect(){
    var selector = document.getElementById("currency-selector");
    var curKeys = JSON.parse(localStorage["currencies"]);
    var resString = "";
    for(var i = 0; i < curKeys.length; i++){
        resString +="<option value='"+curKeys[i]+"'>"+curKeys[i]+"</option>";
    }
    document.getElementById("currency-selector").innerHTML = resString;
    document.getElementById("converter-currency-selector").innerHTML = resString;
}

function initDatePickers(){
    var generalDate = new Date();
    var minimalDate = new Date(2010,6,17);
    document.getElementById('start-date').value = "";
    document.getElementById('end-date').value = "";
    pickerStart = new Pikaday(
    {
        field: document.getElementById('start-date'),
        firstDay: 1,
        minDate: minimalDate,
        maxDate: new Date(),
        onSelect: function(date) {
            dateStart = date;
        }

    });

    var pickerEnd = new Pikaday(
    {
        field: document.getElementById('end-date'),
        firstDay: 1,
        minDate: minimalDate,
        maxDate: new Date(),
        onSelect: function(date) {
            dateEnd = date;
        }
    });
}

function initChart(){
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(function(){
        chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    });
}

function getBitcoinData(){
    console.log(daysBetween());
}

function daysBetween(){
    var ONE_DAY = 1000 * 60 * 60 * 24;
        var difference_ms = Math.abs(dateEnd.getTime() - dateStart.getTime());
        return Math.round(difference_ms/ONE_DAY);
}

function formatDate(date){
    var month = date.getMonth()+1;
    var day = date.getDate();
    if(month<10)month = "0"+month;
    if(day<10)day = "0"+day;
    return date.getFullYear() + "-"+month+"-"+day;
}

function openCurrentRate(){
    if(isSmallScreen)openMainMenu();
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            currencyValues = JSON.parse(xmlHttp.responseText);
            document.getElementById("content").style.display = "none";
            document.getElementById("bitcoin-trend").style.display = "none";
            document.getElementById("current-rate").style.display = "block";
            document.getElementById("bitcoin-converter").style.display = "none";
            var htmlCode = "<table><tr><td>Currency</td><td>Value</td></tr>";
            var keys = Object.keys(currencyValues);
            for(var i = 0; i< keys.length; i++){
                htmlCode += "<tr><td>"+keys[i]+"</td><td>"+currencyValues[keys[i]]["15m"]+" "+currencyValues[keys[i]]["symbol"]+"</td></tr>";
            }
            document.getElementById("current-rate").innerHTML = htmlCode;
            document.getElementById("content").style.display = "block";
        }
    }
    xmlHttp.open("GET", "https://blockchain.info/ticker?cors=true", true); // true for asynchronous 
    xmlHttp.send(null);  
    
}

function openBitcoinTrend(){
    if(isSmallScreen)openMainMenu();
    document.getElementById("content").style.display = "none";
    document.getElementById("bitcoin-trend").style.display = "block";
    document.getElementById("current-rate").style.display = "none";
    document.getElementById("bitcoin-converter").style.display = "none";
    document.getElementById("content").style.display = "block";
}

function openBitcoinConverter(){
    if(isSmallScreen)openMainMenu();
    document.getElementById("content").style.display = "none";
    document.getElementById("bitcoin-trend").style.display = "none";
    document.getElementById("current-rate").style.display = "none";
    document.getElementById("bitcoin-converter").style.display = "block";
    document.getElementById("content").style.display = "block";
}

function getBitcoinHistory()
{
    loadCurrencyValues();
    var url = "https://api.coindesk.com/v1/bpi/historical/close.json?start="+formatDate(dateStart)+"&end="+formatDate(dateEnd);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            makeArrFromTextJson(xmlHttp.responseText);
            if(document.getElementById("currency-selector").value!="USD")convertValues();
            drawChart();
        }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);
}

function drawChart(){
    if(bitconinHistoryArr != null && bitconinHistoryArr.length > 0)
    chart.draw(google.visualization.arrayToDataTable(bitconinHistoryArr),options);
}

function makeArrFromTextJson(json){
    var jsonResponse = JSON.parse(json);
    var jsonResponse = jsonResponse.bpi;
    var dateKeys = Object.keys(jsonResponse);
    bitconinHistoryArr = [["Date","Bitcoin value"]];
    for(var i = 0; i< dateKeys.length; i++){
        bitconinHistoryArr.push([dateKeys[i],jsonResponse[dateKeys[i]]]);
    }
}

function convertValues(){
    var convertTo = document.getElementById("currency-selector").value;
    var newArray = [["Date","Bitcoin value"]];
    for(var i = 1; i< bitconinHistoryArr.length; i++){
        newArray.push([bitconinHistoryArr[i][0],(bitconinHistoryArr[i][1]/currencyValues["USD"]["15m"])*currencyValues[convertTo]["15m"]]);
        //bitconinHistoryArr.push([dateKeys[i],jsonResponse[dateKeys[i]]]);
    }
    bitconinHistoryArr = newArray;
    options.vAxis.title = currencyValues[convertTo].symbol;
}

function convertToBitcoin(){
    var currency = document.getElementById("converter-currency-selector").value;
    var url = "https://blockchain.info/tobtc?currency="+currency+"&value="+document.getElementById("value-to-convert-input").value+"&cors=true";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            document.getElementById("converted-value-label").innerHTML = xmlHttp.responseText;
        }
    }
    xmlHttp.open("GET", url, true); // true for asynchronous 
    xmlHttp.send(null);  
}

function convertFromBitcoin(){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
            currencyValues = JSON.parse(xmlHttp.responseText);
            var currency = document.getElementById("converter-currency-selector").value;
            var value = document.getElementById("value-to-convert-input").value;
            document.getElementById("converted-value-label").innerHTML = value*currencyValues[currency]["15m"];
        }
    }
    xmlHttp.open("GET", "https://blockchain.info/ticker?cors=true", true); // true for asynchronous 
    xmlHttp.send(null);   
}

function openMainMenu(){
    if(isMenuOpened){
        document.getElementById("main-menu-list").style.display = "none";
        isMenuOpened= false;
    }else{
        document.getElementById("main-menu-list").style.display = "block";
        isMenuOpened= true;
    }
    
}

/*function convertValue(currName){
    return (bitconinHistoryArr[i][1]/currencyValues["USD"]["15m"])*currencyValues[convertTo]["15m"];
}*/