export const CONSTS = {
    parentElementId: 'phaser-app',
    gameName: 'Drop the answer',

    buttons: {
        start: { key: 'startbutton', url: 'assets/sprites/button_start.png' }
    },

    backgound: {
        key: 'background',
        url: 'assets/sprites/background.png',
        width: 1536,
        height: 768
    },
    answerBlock: {
        key: 'answerBlock',
        url: 'assets/sprites/block.png',
        width: 60,
        height: 60,
        mass: 0.1,
        bounce: 0.9
    },
    answerBase: {
        key: 'answerBase',
        url: 'assets/sprites/answerBase.png',
        width: 16,
        height: 16,
        count: 3,
        mass: 0.1,
        bounce: 0.1
    },
    ball: {
        key: 'ball',
        url: 'assets/sprites/shinyball.png',
        width: 32,
        height: 32,
        mass: 1,
        bounce: 1.2
    },
    loadScene: { key: 'LoadScene' },
    gameScene: { key: 'GameScene' },
    answer: {
        fontStyle: {
            font: '50px Arial',
            fill: '#FFCC00',
            stroke: '#333',
            strokeThickness: 5,
            align: 'center'
        }
    },
    question: {
        startY: 30,
        fontStyle: {
            font: '50px Arial',
            fill: '#FFCC00',
            stroke: '#333',
            strokeThickness: 5,
            align: 'center'
        }
    },
    world: { walls: { bottomKey: 'bottom' } },
    restartGameTimer: { collision: 3500, noCollision: 10000 }
};

function addBackground() {
    var bgScaleWidth = this.game.config.width / CONSTS.backgound.width;
    var bgScaleHeight = this.game.config.height / CONSTS.backgound.height;

    this.add
        .image(0, 0, CONSTS.backgound.key)
        .setOrigin(0)
        .setScale(bgScaleWidth, bgScaleHeight);
}
