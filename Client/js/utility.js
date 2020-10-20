// Handles Repeated Actions
function show(shown, hidden) {
    $(shown).show();
    $(hidden).hide();
}

function player1Show(a) {
    let action = "#" + a + "1";
    $("#charge1").hide();
    $("#pistol1").hide();
    $("#d_pistol1").hide();
    $("#block1").hide();
    $("#counter1").hide();
    $("#evade1").hide();
    $(action).show();
}

function player2Show(a) {
    let action = "#" + a + "2";
    $("#charge2").hide();
    $("#pistol2").hide();
    $("#d_pistol2").hide();
    $("#block2").hide();
    $("#counter2").hide();
    $("#evade2").hide();
    $(action).show();
}

function hidePast() {
    $("#charge1").hide();
    $("#pistol1").hide();
    $("#d_pistol1").hide();
    $("#block1").hide();
    $("#counter1").hide();
    $("#evade1").hide();
    $("#charge2").hide();
    $("#pistol2").hide();
    $("#d_pistol2").hide();
    $("#block2").hide();
    $("#counter2").hide();
    $("#evade2").hide();
}