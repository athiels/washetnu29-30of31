var jq = $.noConflict();
var app = angular.module('Songs-app', ["ngAnimate", "ngRoute"]);
app.config(function ($routeProvider) {
    $routeProvider.when("/", {
        templateUrl: "songs.html"
    }).when("/home/", {
        templateUrl: "home.html"
    });
});
app.controller("songListController", function ($scope, $http, $location) {
    $scope.userMail = sessionStorage.getItem('songs-user');
    $scope.userFname;
    $scope.userLname;
    $scope.trustSrc = function (src) {
        return $sce.trustAsResourceUrl(src);
    }

    function getUserInfo() {
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "/getuserinfo");
        xhr.setRequestHeader("mail", $scope.userMail);
        xhr.onload = function () {
            if (xhr.status === 200) {
                var userInfo = JSON.parse(xhr.responseText);
                $scope.userFname = userInfo.userInfo[0][0].fname;
                $scope.userLname = userInfo.userInfo[0][0].lname;
                $scope.$apply();
            }
        }
        xhr.send();
    }
    getUserInfo();

    function getSongs() {
        var songList = [];
        var xhr = new XMLHttpRequest()
        xhr.open("GET", "/getsongs");
        xhr.onload = function () {
            if (xhr.status === 200) {
                var songs = JSON.parse(xhr.responseText);
                $scope.songList = songs.songs[0];
                $scope.$apply();
                console.log($scope.songList);
            }
        }
        xhr.send();
    }
    getSongs();
    $scope.addSong = function () {
        if ($scope.userMail) {
            showAddSongModal();
        }
        else {
            showLogInModal();
        }
    }
    $scope.upvoteSong = function (song) {
        if ($scope.userMail) {
            console.log("Upvoting " + song.title);
            var xhr = new XMLHttpRequest()
            xhr.open("POST", "/upvotesong");
            xhr.setRequestHeader("user", $scope.userMail);
            xhr.setRequestHeader("title", song.title);
            xhr.setRequestHeader("artist", song.artist);
            xhr.setRequestHeader("upvotes", song.upvotes + 1);
            xhr.onload = function () {
                if (xhr.status === 200) {
                    location.reload()
                }
            }
            xhr.send();
        }
        else {
            showLogInModal();
        }
    }
    $scope.logOut = function () {
        sessionStorage.setItem('songs-user', "");
        location.reload();
    }
    $scope.logIn = function () {
        showLogInModal();
    }
    $scope.showWebsiteInfo = function () {
        bootbox.alert({
            message: jq(".info").html()
        })
    }

    function showAddSongModal() {
        var title = "<h1>Zelf een liedje toevoegen</h1><h4>Titel en artiest zijn verplicht. <br>Je mag ook een link (URL) van een YouTube filmpje invullen!</h4>"
        var modal = bootbox.dialog({
            message: jq(".form-content").html()
            , title: title
            , buttons: [
                {
                    label: "Toevoegen!"
                    , className: "btn btn-success pull-right"
                    , callback: function () {
                        var form = modal.find(".form");
                        var items = form.serializeJSON();
                        if (items.songTitle && items.songArtist) {
                            var xhr = new XMLHttpRequest()
                            xhr.open("POST", "/addsong");
                            xhr.setRequestHeader("usermail", $scope.userMail);
                            xhr.setRequestHeader("userfname", $scope.userFname);
                            xhr.setRequestHeader("userlname", $scope.userLname);
                            xhr.setRequestHeader("title", items.songTitle);
                            xhr.setRequestHeader("artist", items.songArtist);
                            xhr.setRequestHeader("yturl", items.songYturl);
                            xhr.onload = function () {
                                if (xhr.status === 200) {
                                    bootbox.alert({
                                        message: "<h3>'" + items.songTitle + "' van '" + items.songArtist + "' is toegevoegd aan onze muzieklijst!</h3>"
                                        , callback: function () {
                                            location.reload();
                                        }
                                    })
                                }
                            }
                            xhr.send();
                            modal.modal("hide");
                            return false;
                        }
                        else {
                            if (!items.songTitle) {
                                jq('#em_title').text("Vul alsjeblieft de titel van het lied in.");
                            }
                            if (!items.songArtist) {
                                jq('#em_artist').text("Vul alsjeblieft de artist van het lied in.");
                            }
                            showAddSongModal();
                        }
                    }
          }
                , {
                    label: "Sluiten"
                    , className: "btn btn-default pull-left"
                    , callback: function () {}
          }
        ]
            , show: false
            , onEscape: function () {
                modal.modal("hide");
            }
        });
        modal.modal("show");
    }

    function showLogInModal() {
        var title = "<h1>Aanmelden</h1><h4>Om liedjes toe te voegen of te liken moet je even aanmelden.</h4><h4>Je kan aanmelden zonder wachtwoord, we hebben enkel je e-mail adres nodig!</h4>"
        var modal = bootbox.dialog({
            message: jq(".inlog-form").html()
            , title: title
            , buttons: [
                {
                    label: "Aanmelden!"
                    , className: "btn btn-primary pull-right"
                    , callback: function () {
                        var form = modal.find(".form");
                        var items = form.serializeJSON();
                        var xhr = new XMLHttpRequest()
                        xhr.open("POST", "/authenticate");
                        xhr.setRequestHeader("mail", items.logInMail);
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                sessionStorage.setItem('songs-user', items.logInMail);
                                location.reload();
                            }
                            else if (xhr.status === 422) {
                                $scope.createAccountMail = items.logInMail;
                                showCreateAccountModal(items.logInMail);
                            }
                        }
                        xhr.send();
                        modal.modal("hide");
                        return false;
                    }
          }
                , {
                    label: "Sluiten"
                    , className: "btn btn-default pull-left"
                    , callback: function () {}
          }
        ]
            , show: false
            , onEscape: function () {
                modal.modal("hide");
            }
        });
        modal.modal("show");
    }

    function showCreateAccountModal(createAccountMail) {
        var title = "<h1>Maak een account aan</h1><h4>We hebben je e-mail adres niet terug gevonden. <br>Maak snel even je account aan!</h4> <br> <h3>" + createAccountMail + "</h3>"
        var modal = bootbox.dialog({
            message: jq(".createAccount-form").html()
            , title: title
            , buttons: [
                {
                    label: "Account aanmaken!"
                    , className: "btn btn-primary pull-right"
                    , callback: function () {
                        var form = modal.find(".form");
                        var items = form.serializeJSON();
                        var xhr = new XMLHttpRequest()
                        xhr.open("POST", "/createuser");
                        xhr.setRequestHeader("fname", items.createAccountFirstName);
                        xhr.setRequestHeader("lname", items.createAccountLastName);
                        xhr.setRequestHeader("mail", createAccountMail);
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                sessionStorage.setItem('songs-user', createAccountMail);
                                location.reload();
                            }
                            else if (xhr.status === 409) {
                                bootbox.alert("<h1>Oops!</h1><h4> Sorry! Er is iets fout gelopen, probeer het nog een keer.</h4>");
                            }
                        }
                        xhr.send();
                        modal.modal("hide");
                        return false;
                    }
          }
                , {
                    label: "Sluiten"
                    , className: "btn btn-default pull-left"
                    , callback: function () {}
          }
        ]
            , show: false
            , onEscape: function () {
                modal.modal("hide");
            }
        });
        modal.modal("show");
    }
    jQuery.fn.serializeJSON = function () {
        var json = {};
        jQuery.map(jQuery(this).serializeArray(), function (n) {
            var _ = n.name.indexOf('[');
            if (_ > -1) {
                var o = json
                    , _name;
                _name = n.name.replace(/\]/gi, '').split('[');
                for (var i = 0, len = _name.length; i < len; i++) {
                    if (i == len - 1) {
                        if (o[_name[i]]) {
                            if (typeof o[_name[i]] == 'string') {
                                o[_name[i]] = [o[_name[i]]];
                            }
                            o[_name[i]].push(n.value);
                        }
                        else {
                            o[_name[i]] = n.value || '';
                        }
                    }
                    else {
                        o = o[_name[i]] = o[_name[i]] || {};
                    }
                }
            }
            else if (json[n.name] !== undefined) {
                if (!json[n.name].push) {
                    json[n.name] = [json[n.name]];
                }
                json[n.name].push(n.value || '');
            }
            else {
                json[n.name] = n.value || '';
            }
        });
        return json;
    };
    jq(function () { //<-----------------------doc ready
        jq(window).on('scroll', function () {
            var scrollPos = jq(document).scrollTop();
            jq('.scroll').css({
                top: scrollPos
            });
        }).scroll();
    });
});