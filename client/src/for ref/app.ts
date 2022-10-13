import Menu from './menu'

window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    let menu = new Menu('renderCanvas');

    // Create the scene.
    menu.createMenu();
});
