export function checkVisible(elm) {
    const rect = elm.getBoundingClientRect();
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}

export function resizeWindowChecker(timeout = 500) {
    setTimeout(() => {
        const roomView = document.querySelector('.room-view');
        if (roomView) {

            console.log(roomView.offsetWidth);

        }
    }, timeout);
}