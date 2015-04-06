window.onload = function() {
    g_Tabs = []
    cur_tab_set = 0;

    var Tab = function(url) {
        this.url = url;

        var spinner = document.createElement("div");
        spinner.classList.add("fa");
        spinner.classList.add("fa-spinner");
        spinner.classList.add("tab-spinner");
        this.progress = 0;
        this.timerId = null;
        this.spinner = spinner;

        var closeButton = document.createElement("div");
        closeButton.classList.add("fa");
        closeButton.classList.add("fa-times");
        closeButton.classList.add("tab-close-icon");
        closeButton.onclick = function(e) {
            this.close();
            e.stopPropagation();
        }.bind(this);

        this.titleText = document.createTextNode(url);
        var container = document.createElement("div");
        container.classList.add("tab-text");
        container.appendChild(this.titleText);

        var label = document.createElement("li");
        label.classList.add("tab");
        label.appendChild(spinner);
        label.appendChild(container);
        label.appendChild(closeButton);
        label.onclick = function() {
            var prevTab = getActiveTab();
            if (prevTab !== this) {
                prevTab.deactivate();
                this.activate();
            }
        }.bind(this);

        this.startSpinner = function() {
            this.stopSpinner();

            this.timerId = setInterval(function() {
                this.spinner.style.transform = "rotate(" + this.progress + "turn)";
                this.progress += 0.01;
            }.bind(this), 16.67);
        }
        this.stopSpinner = function() {
            if (this.timerId !== null) {
               clearInterval(this.timerId);
               this.timerId = null;
           }
        }

        var iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.mozbrowser = true;
        iframe.classList.add("page-container");

        if (!iframe.mozbrowser) {
            console.log("!!!!! Unable to create a mozbrowser frame - are you running with experimental (-e) mode enabled? !!!!!")
            window.close();
        }

        iframe.addEventListener("mozbrowserloadstart", function(event) {
            this.startSpinner();
        }.bind(this));

        iframe.addEventListener("mozbrowserloadend", function(event) {
            this.stopSpinner();
        }.bind(this));

        iframe.addEventListener("mozbrowsertitlechange", function(event) {
            this.titleText.nodeValue = event.detail;
            updateUi();
        }.bind(this));

        iframe.addEventListener("mozbrowserlocationchange", function(event) {
            this.url = event.detail;
            updateUi();
        }.bind(this));

        var content_element = document.getElementById("content");
        content_element.appendChild(iframe);

        this.label = label;
        this.iframe = iframe;

        this.close = function() {
            removeTab(this);
        }
        this.isActive = function() {
            return this.label.classList.contains("tab-active");
        };
        this.activate = function() {
            this.label.classList.add("tab-active");
            this.iframe.classList.remove("hidden");
            // switch the tabs to the page that this tab is on
            for(var i in g_Tabs) {
                if(g_Tabs[i] == this) {
                    cur_tab_set = Math.floor(i / calcMaxTabs());
                    break;
                }
            }
            updateUi();
        };
        this.deactivate = function() {
            this.iframe.classList.add("hidden");
            this.label.classList.remove("tab-active");
        };
        this.hideLabel = function() {
            this.label.classList.add("hidden");
        }
        this.showLabel = function() {
            this.label.classList.remove("hidden");
        }
        this.reload = function() {
            try {
                this.iframe.reload();
            }
            catch (e) {
                console.log("iframe.reload is not implemented yet");
            }
        }
        this.forward = function() {
            try {
                this.iframe.goForward();
            }
            catch (e) {
                console.log("iframe.goForward doesn't exist - you probably need to run Servo with experimental mode enabled (-e)");
                window.close();
            }
            updateUi();
        }
        this.back = function() {
            try {
                this.iframe.goBack();
            }
            catch (e) {
                console.log("iframe.goBack doesn't exist - you probably need to run Servo with experimental mode enabled (-e)");
                window.close();
            }
            updateUi();
        }
        this.load = function(url) {
            var lower_url = url.toLowerCase();

            if (lower_url.indexOf("http://") === -1 &&
                lower_url.indexOf("https://") === -1) {
                url = "http://" + url;
            }

            this.iframe.src = url;
        }
    }

    createAndAddTab = function(url) {
        var tab = new Tab(url);
        g_Tabs.push(tab);
        tab.activate();

        var newTabButton = document.getElementById("new-tab");
        var tabContainer = document.getElementById("tab-container");
        tabContainer.insertBefore(tab.label, newTabButton);

        return tab;
    }

    getActiveTab = function() {
        for (var i=0 ; i < g_Tabs.length ; ++i) {
            var tab = g_Tabs[i];
            if (tab.isActive()) {
                return tab;
            }
        }
        throw "Unable to find active tab!";
    }

    removeTab = function(tab) {
        var index = g_Tabs.indexOf(tab);
        if (index === -1) {
            throw "Unable to find tab to remove";
        }
        var tab = g_Tabs.splice(index, 1)[0];
        var is_active = tab.isActive();
        if (is_active) {
            tab.deactivate();
        }
        tab.label.parentNode.removeChild(tab.label);

        if (g_Tabs.length === 0) {
            window.close();
        } else if (is_active) {
            var nextIndex = index - 1;
            if (nextIndex < 0) {
                nextIndex = 0;
            }
            var nextTab = g_Tabs[nextIndex];
            nextTab.activate();
        }
        updateUi();
    }

    onNewTab = function() {
        if (g_Tabs.length > 0) {
            var prevTab = getActiveTab();
            prevTab.deactivate();
        }

        createAndAddTab("about:blank");
    }

    updateUi = function() {
        var tab = getActiveTab();
        getUrlBar().value = tab.url;
        document.title = tab.titleText.nodeValue;

        // only show the label for tabs of the page we're on
        max_tabs = calcMaxTabs();
        i_min = cur_tab_set * max_tabs
        i_max = i_min + max_tabs;
        for(var i in g_Tabs) {
            if(i < i_min || i >= i_max){
                g_Tabs[i].hideLabel();
            } else {
                g_Tabs[i].showLabel();
            }
        }

        // hide the previous button if we're on the first page
        prev_btn =  document.getElementById("tab-set-prev");
        if(cur_tab_set == 0) {
            prev_btn.classList.add("hidden");
        } else {
            prev_btn.classList.remove("hidden");
        }

        // hide the next button if we're on the last page
        next_btn = document.getElementById("tab-set-next");
        if(i_max >= g_Tabs.length) {
            next_btn.classList.add("hidden");
        } else {
            next_btn.classList.remove("hidden");
        }
    }

    calcMaxTabs = function() {
        // TODO: replace with document.width once it exists
        windowWidth = document.getElementsByTagName("body")[0].getBoundingClientRect().width;
        
        // magic numbers, i know. this is supposed to be:
        // width of the window, minus the width of the buttons that are always visible (new tab)
        // divided by the width of an individual tab
        return Math.floor((windowWidth - 80) / 158)
    }

    prevSet = function() {
        if(cur_tab_set == 0) {
            return
        }
        cur_tab_set--;
        updateUi();
    }

    nextSet = function() {
        max_tabs = calcMaxTabs();
        if(g_Tabs.length / max_tabs < cur_tab_set + 1) {
            return;
        }
        cur_tab_set++;
        updateUi();
    }

    onReload = function() {
        getActiveTab().reload();
    }

    onNavigate = function(event) {
        if (event.keyCode == 8 || event.keyCode == 46) {
            getUrlBar().value = "";
            event.preventDefault();
        } else if (event.keyCode == 13) {
            var active_tab = getActiveTab();
            active_tab.load(getUrlBar().value)
        }
    }

    onForward = function() {
        getActiveTab().forward();
    }

    onBack = function() {
        getActiveTab().back();
    }

    onResize = function() {
        getActiveTab().activate();
    }

    getUrlBar = function() {
        return document.getElementById("header-url");
    }

    // Create initial tab
    createAndAddTab("about:blank");

    window.addEventListener("resize", onResize);
}
