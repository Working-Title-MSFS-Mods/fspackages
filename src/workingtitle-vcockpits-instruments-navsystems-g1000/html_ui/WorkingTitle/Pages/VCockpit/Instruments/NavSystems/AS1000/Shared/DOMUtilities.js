class DOMUtilities {
}

DOMUtilities.IsChildOf = function (child, parent) {
    let parentNode = child.parentNode;
    do {
        if (parentNode == parent)
            return true;
    } while (parentNode = parentNode.parentNode);
    return false;
}

DOMUtilities.IsChildOfSelector = function (child, selector) {
    let parentNode = child.parentNode;
    do {
        if (parentNode.matches(selector))
            return true;
    } while (parentNode = parentNode.parentNode);
    return false;
}

// Gets the closest parent matching a selector
DOMUtilities.GetClosestParent = function (node, selector) {
    while (node = node.parentNode) {
        if (node == document)
            return null;
        if (node.matches(selector))
            return node;
    }
    return null;
}

DOMUtilities.RemoveChildren = function (node, selector) {
    let removed = 0;
    let children = Array.from(node.children);
    for (let child of children) {
        if (selector) {
            if (!child.matches(selector)) {
                continue;
            }
        }
        node.removeChild(child);
        removed++;
    }
}

DOMUtilities.AppendChildren = function (node, children) {
    for (let child of children)
        node.appendChild(child);
}

// Add an event listener to "node" that catches "e" when fired on an element matching "selector"
// Avoids having to attach listeners to every node
DOMUtilities.AddScopedEventListener = function (node, selector, e, func, capture = false) {
    var func2 = function (e) {
        var targetNode = e.target;

        while (targetNode != null && targetNode != document) {
            if (targetNode.matches(selector)) {
                if (e == "mouseout" || e == "mouseover") {
                    if (targetNode.contains(e.relatedTarget))
                        return;
                }
                func.call(targetNode, e, targetNode);
            }
            if (node == targetNode)
                return;

            targetNode = targetNode.parentNode;
        }
    };
    node.addEventListener(e, func2, capture);
    return func2;
}

// Repopulates an element minimising adding/removing nodes
DOMUtilities.repopulateElement = function (listElement, elements) {
    let firstElement = listElement.firstChild;
    let previousElement = null;
    let first = true;
    let modifications = 0;
    for (let element of elements) {
        if (previousElement && previousElement.nextSibling == element || (first && firstElement == element)) {
        } else {
            if (previousElement && previousElement.nextSibling) {
                listElement.insertBefore(element, first ? listElement.firstChild : previousElement.nextSibling);
                modifications++;
            } else {
                if (first) {
                    listElement.insertBefore(element, listElement.firstChild);
                } else {
                    listElement.appendChild(element);
                }
                modifications++;
            }
        }
        previousElement = element;
        first = false;
    }
    if (previousElement) {
        let remove = previousElement.nextSibling;
        while (remove) {
            modifications++;
            let next = remove.nextSibling;
            listElement.removeChild(remove);
            remove = next;
        }
    }
}

DOMUtilities.debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};