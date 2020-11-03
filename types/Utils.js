/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

const Utils = {
    dispatchToAllWindows(event) {
        window.top.dispatchEvent(event);
        if (window.top.frames) {
            for (var i = 0; i < window.frames.length; i++) {
                window.frames[i].dispatchEvent(event);
            }
        }
    },
    toArray(array) {
        return Array.prototype.slice.call(array);
    },
    inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },
    createDiv(...classList) {
        let div = document.createElement('div');
        classList.forEach(cssClass => {
            div.classList.add(cssClass);
        });
        return div;
    },
    getVh(percent) {
        return (percent / 100) * Utils.getVirtualHeight() + "px";
    },
    getSize(px) {
        return (px / 1080) * Utils.getVirtualHeight();
    },
    getVhNumber(percent) {
        return (percent / 100) * Utils.getVirtualHeight();
    },
    getScreenRatio() {
        return (window.innerWidth * window.vw) / Utils.getVirtualHeight();
    },
    getVirtualHeight() {
        return window["screenHeight"];
    },
    scrollbarVisible(element) {
        return element.scrollHeight > element.clientHeight;
    },
    getExternalImageUrl(url, prefix = "") {
        return "url('" + prefix + url.replace(/\\/g, '/') + "')";
    },
    Modulo(num, mod) {
        return ((num % mod) + mod) % mod;
    },
    pad(num, size) {
        var s = num + "";
        while (s.length < size)
            s = "0" + s;
        return s;
    },
    replace_nth(str, find, replace, index) {
        index += 1;
        if (index == 0) {
            return str.replace(find, replace);
        }
        return str.replace(RegExp("^(?:.*?" + find + "){" + index + "}"), x => x.replace(RegExp(find + "$"), replace));
    },
    forceParagraphLines(text, n = 2) {
        let formattedText = text.replace('/', '/­');
        let words = formattedText.split(' ');
        if (words.length > 2) {
            let scores = [];
            words.reduce((leftLength, word, index, wordArr) => {
                    let currentIndex = leftLength + word.length;
                    scores[index] = Math.abs(currentIndex - (formattedText.length - currentIndex - 1));
                    if (index < words.length - 1) {
                        currentIndex += 1;
                    }
                    return currentIndex;
                },
                0);
            var indexOfMinValue = scores.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0);
            let done = 0;
            for (let i = 0; i < words.length; i++) {
                if (i != indexOfMinValue) {
                    formattedText = Utils.replace_nth(formattedText, ' ', '&nbsp;', i - done);
                    done++;
                }
            }
        }
        return formattedText;
    },
    dashToCamelCase(myStr) {
        return myStr.replace(/-([a-z])/g, function (g) {
            return g[1].toUpperCase();
        });
    },
    timeLine(str) {
        var d = new Date();
        var s = d.getSeconds();
        var m = d.getMilliseconds();
    },
    DisplayTimeToSeconds(str) {
        var list = str.split(":");
        var hours = 0;
        var minutes = 0;
        var seconds = 0;
        if (list.length >= 1) {
            hours = parseInt(list[0]);
            if (list.length >= 2) {
                minutes = parseInt(list[1]);
                if (list.length >= 3) {
                    seconds = parseInt(list[2]);
                }
            }
        }
        var val = hours * 3600 + minutes * 60 + seconds;
        return val;
    },
    urlEqual(url1, url2) {
        if (!url1)
            return false;
        url1 = url1.replace("coui://html_ui", "");
        url1 = url1.replace("coui://html_UI", "");
        url2 = url2.replace("coui://html_ui", "");
        url2 = url2.replace("coui://html_UI", "");
        return url1 == url2;
    },
    RemoveAllChildren(elem) {
        if (elem) {
            while (elem.lastChild)
                elem.removeChild(elem.lastChild);
        }
    },
    formatNumber(x) {
        let str = x.toString();
        let g_localization = window.top["g_localization"];
        if (g_localization)
            return g_localization.FormatNumberInString(str, false);
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
    formatInteger(x) {
        let str = fastToFixed(x, 0);
        let g_localization = window.top["g_localization"];
        if (g_localization)
            return g_localization.FormatNumberInString(str, true);
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
    Clamp(n, min, max) {
        if (n < min)
            return min;
        if (n > max)
            return max;
        return n;
    },
    Loop(n, min, max) {
        if (n < min)
            return max - Math.abs(n);
        if (n > max)
            return Math.abs(n - max);
        return n;
    },
    isHidden(el, recurs) {
        if (!el)
            return false;
        var style = el.ownerDocument.defaultView.getComputedStyle(el);
        var ishidden = (style.display === 'none');
        if (ishidden) {
            return true;
        } else if (recurs) {
            return isHidden(el.parentElement, true);
        }
        return false;
    },
    isVisible(elem) {
        if (!(elem instanceof Element))
            throw Error('DomUtil: elem is not an element.');
        const style = getComputedStyle(elem);
        if (style.display === 'none')
            return false;
        if (style.visibility !== 'visible')
            return false;
        if (style.opacity == "0")
            return false;
        let rect = elem.getBoundingClientRect();
        if (elem.offsetWidth + elem.offsetHeight + rect.height +
            rect.width === 0) {
            return false;
        }
        var elementPoints = {
            'center': {
                x: rect.left + elem.offsetWidth / 2,
                y: rect.top + elem.offsetHeight / 2
            },
            'top-left': {
                x: rect.left,
                y: rect.top
            },
            'top-right': {
                x: rect.right,
                y: rect.top
            },
            'bottom-left': {
                x: rect.left,
                y: rect.bottom
            },
            'bottom-right': {
                x: rect.right,
                y: rect.bottom
            }
        };
        let index;
        for (index in elementPoints) {
            var point = elementPoints[index];
            if (point.x < 0)
                return false;
            if (point.x > (document.documentElement.clientWidth || window.innerWidth))
                return false;
            if (point.y < 0)
                return false;
            if (point.y > (document.documentElement.clientHeight || window.innerHeight))
                return false;
            let pointContainer = document.elementFromPoint(point.x, point.y);
            if (pointContainer !== null) {
                do {
                    if (pointContainer === elem)
                        return true;
                } while (pointContainer = pointContainer.parentNode);
            }
        }
        return false;
    },
    strToBool(str) {
        if (str.toLowerCase() == "true")
            return true;
        return false;
    },
    setInputFilter(textbox, inputFilter) {
        ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
            textbox.addEventListener(event, function () {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                } else if (this.hasOwnProperty("oldValue")) {
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                }
            });
        });
    },
    isNumeric(str) {
        let n = parseFloat(str);
        return str.length > 0 && !isNaN(n) && isFinite(n);
    },
    isInteger(str) {
        let n = parseInt(str);
        return str.length > 0 && !isNaN(n) && isFinite(n);
    },
    SmoothPow(origin, destination, smoothFactor, dTime) {
        if (origin == undefined)
            return destination;
        if (dTime <= 0 || smoothFactor <= 1.0)
            return destination;
        var smooth = 1.0 - (1.0 / Math.pow(smoothFactor, dTime * (1.0 / 0.033)));
        var delta = destination - origin;
        var result = (delta * smooth) + origin;
        return result;
    },
    SmoothLinear(origin, destination, smoothFactor, dTime) {
        if (origin == undefined)
            return destination;
        if (smoothFactor <= 0)
            return destination;
        if (Math.abs(destination - origin) < Number.EPSILON)
            return destination;
        let result = destination;
        if (origin > destination) {
            result = origin - smoothFactor * dTime;
            if (result < destination)
                result = destination;
        } else {
            result = origin + smoothFactor * dTime;
            if (result > destination)
                result = destination;
        }
        return result;
    },
    SmoothSin(origin, destination, smoothFactor, dTime) {
        if (origin == undefined)
            return destination;
        if (Math.abs(destination - origin) < Number.EPSILON)
            return destination;
        let delta = destination - origin;
        let result = origin + delta * Math.sin(Math.min(smoothFactor * dTime, 1.0) * Math.PI / 2.0);
        if ((origin < destination && result > destination) || (origin > destination && result < destination))
            result = destination;
        return result;
    },
    ClearIframe(elem) {
        function clearInner(node) {
            while (node.hasChildNodes()) {
                clear(node.firstChild);
            }
        }

        function clear(node) {
            while (node.hasChildNodes()) {
                clear(node.firstChild);
            }
            node.parentNode.removeChild(node);
        }

        clearInner(elem);
    },
    generateGUID() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return "GUID_" + (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    containStr(str, title) {
        str = str.trim().toLowerCase();
        title = title.trim().toLowerCase();
        if (str == "" || title == "") {
            return true;
        }
        if (title.indexOf(str) !== -1) {
            return true;
        }
        return false;
    },
    getCaretPosition(ctrl) {
        var caretPos = 0;
        if (document.selection) {
            ctrl.focus();
            var sel = document.selection.createRange();
            sel.moveStart('character', -ctrl.value.length);
            caretPos = sel.text.length;
        } else if (ctrl.selectionStart || ctrl.selectionStart == '0') {
            caretPos = ctrl.selectionStart;
        }
        return caretPos;
    },
    setCaretPosition(ctrl, pos) {
        if (ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);
        } else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    },
    generateRandomName() {
        let alphabet = "aaaaaaaaaabcdeeeeeeeefghiiiiiijklmnooooooopqrstuvwxyz";
        let ret = "";
        let nbChars = Math.random() * 15 + 4;
        for (let i = 0; i < nbChars; i++) {
            let index = Math.floor(Math.random() * alphabet.length);
            ret += alphabet.charAt(index);
        }
        return ret;
    },
    generateLorem(length) {
        let base = "Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.Lateri et dives Tauri attolluntur late Tauri omnibus bonis interscindit qui dextro attolluntur qui Cilicia viget bonis frugibus interscindit flumen viget adnexa porrigitur late eiusque palmite flumen dextro pari ortum lateri palmite omnibus palmite adnexa mediam eiusque solis solis quam frugibus palmite eiusque Calycadnus navigabile pari Calycadnus porrigitur flumen lateri attolluntur attolluntur frugibus ad adnexa solis ortum Tauri Tauri qui Isauria qui Tauri quam mediam Tauri solis ad dives viget montis terra Isauria solis Cilicia bonis adnexa uberi pari Tauri pari adnexa et sublimius Calycadnus distentis navigabile palmite solis solis eiusque et viget uberi porrigitur minutis distentis mediam Cilicia Cilicia.";
        let start = Math.round((Math.random() * base.length - length));
        return base.substring(start, start + length);
    },
    filterProfanity(str) {
        let list = ["bitch", "shit", "asshole"];
        for (let word of list) {
            var searchMask = word;
            var regEx = new RegExp(searchMask, "ig");
            str = str.replace(regEx, "");
        }
        return str;
    },
    Translate(key) {
        if (debugLocalization != null && debugLocalization === true)
            return "";
        if (key == null || key === "")
            return "";
        let g_localization = window.top["g_localization"];
        if (g_localization)
            return g_localization.Translate(key);
        return null;
    },
    SetTextVariable(varName, value) {
        let g_localization = window.top["g_localization"];
        if (g_localization)
            g_localization.AddTextVariable(varName, value);
    },
    SecondsToDisplayDuration(totalSeconds, withMinutes, withSeconds, doLocalize = true) {
        if (doLocalize) {
            let g_localization = window.top["g_localization"];
            if (g_localization)
                return g_localization.SecondsToDisplayDuration(totalSeconds, withMinutes, withSeconds);
        }
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = (withMinutes) ? Math.floor((totalSeconds - (hours * 3600)) / 60) : -1;
        var seconds = (withSeconds) ? Math.floor(totalSeconds - (minutes * 60) - (hours * 3600)) : -1;
        return timeToString(hours, minutes, seconds);
    },
    SecondsToDisplayTime(totalSeconds, withMinutes, withSeconds, doLocalize = true) {
        if (doLocalize) {
            let g_localization = window.top["g_localization"];
            if (g_localization)
                return g_localization.SecondsToDisplayTime(totalSeconds, withMinutes, withSeconds);
        }
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = (withMinutes) ? Math.floor((totalSeconds - (hours * 3600)) / 60) : -1;
        var seconds = (withSeconds) ? Math.floor(totalSeconds - (minutes * 60) - (hours * 3600)) : -1;
        return timeToString(hours, minutes, seconds);
    },
    timeToString(hours, minutes, seconds) {
        let val = "";
        if (hours < 10)
            val += "0";
        val += hours;
        if (minutes >= 0) {
            val += ":";
            if (minutes < 10)
                val += "0";
            val += minutes;
            if (seconds >= 0) {
                val += ":";
                if (seconds < 10)
                    val += "0";
                val += seconds;
            }
        }
        return val;
    },
    doesFileExist(file) {
        if (!g_fileExistCache)
            g_fileExistCache = {};
        if (g_fileExistCache[file] != null) {
            return g_fileExistCache[file];
        }
        let fileMgr = window.top["g_fileMgr"];
        if (file.startsWith("/"))
            file = "coui://html_UI/" + file;
        if (fileMgr) {
            let ret = fileMgr.DoesFileExist(file);
            g_fileExistCache[file] = ret;
            return ret;
        } else
            return false;
    },
    loadFile(file, callbackSuccess) {
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function (data) {
            if (this.readyState === XMLHttpRequest.DONE) {
                let loaded = this.status === 200 || this.status === 0;
                if (loaded) {
                    callbackSuccess(this.responseText);
                }
            }
        };
        httpRequest.open("GET", file);
        httpRequest.send();
    },
    slowDeepClone(object) {
        return JSON.parse(JSON.stringify(object));
    },
    showTooltip(id, tooltip, posXRel, posYRel, maxWidth = -1) {
        if (g_externalVariables.showTooltips) {
            Coherent.trigger("SHOW_TOOLTIP", id, tooltip, posXRel, posYRel, maxWidth);
        }
    },
    hideTooltip(id) {
        if (g_externalVariables.showTooltips) {
            Coherent.trigger("HIDE_TOOLTIP", id);
        }
    },
    leadingZeros(_value, _nbDigits, _pointFixed = -1) {
        if (_pointFixed >= 0)
            _value = Number(_value.toFixed(_pointFixed));
        let i = 1;
        while (i <= _nbDigits) {
            let max = Math.pow(10, i);
            if (_value < max) {
                let result = "";
                while (i < _nbDigits) {
                    result += "0";
                    i++;
                }
                if (_pointFixed >= 0)
                    result += _value.toFixed(_pointFixed);
                else
                    result += _value;
                return result;
            }
            i++;
        }
        if (_pointFixed >= 0)
            return _value.toFixed(_pointFixed);
        return _value.toString();
    },
    countDecimals(_step) {
        var text = _step.toString();
        var index = text.indexOf(".");
        return index == -1 ? 0 : (text.length - index - 1);
    }
}