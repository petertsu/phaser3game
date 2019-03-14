import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

import { CONSTS } from './consts';

var gameConfig = {
    type: Phaser.AUTO,
    width: document.getElementById(CONSTS.parentElementId).offsetWidth,
    height: document.getElementById(CONSTS.parentElementId).offsetHeight,
    resolution: Math.floor(window.devicePixelRatio),
    backgroundColor: '#ffffff',
    parent: CONSTS.parentElementId,
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: {
                y: 0.8
            }
        }
    },
    scene: [GameScene]
};

class DropTheAnswerGame extends Phaser.Game {
    constructor() {
        super(gameConfig);
    }
}

const game = new DropTheAnswerGame();
