import Phaser from 'phaser';

var answers = [{ text: '1' }, { text: '1' }, { text: '1' }, { text: '1' }];

var gameBodies = [];

var CONSTS = {
    parentElementId: 'phaser-app',
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
        mass: 8,
        bounce: 1
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
    world: { walls: { bottomKey: 'bottom' } }
};

function addBackground() {
    var bgScaleWidth = this.game.config.width / CONSTS.backgound.width;
    var bgScaleHeight = this.game.config.height / CONSTS.backgound.height;

    this.add
        .image(0, 0, CONSTS.backgound.key)
        .setOrigin(0)
        .setScale(bgScaleWidth, bgScaleHeight);
}

function showInstructionsText() {
    this.add
        .text(
            this.game.config.width * 0.5,
            this.game.config.height * 0.3,
            'Draw a curve from the ball to \nthe answer and click on the ball',
            CONSTS.question.fontStyle
        )
        .setOrigin(0.5);

    this.add
        .image(
            this.game.config.width * 0.5,
            this.game.config.height * 0.6,
            CONSTS.buttons.start.key
        )
        .setOrigin(0.5)
        .setInteractive()
        .on(
            'pointerdown',
            function() {
                this.scene.start(CONSTS.gameScene.key);
            },
            this
        );
}

function addBall() {
    var positionX =
        CONSTS.ball.width * 0.5 +
        Math.floor(
            Math.random() * (this.game.config.width - CONSTS.ball.width * 1.5)
        );
    var postionY = CONSTS.question.startY + 1.2 * CONSTS.ball.height;

    gameBodies.push(
        this.matter.add
            .image(positionX, postionY, CONSTS.ball.key, null, {
                label: CONSTS.ball.key,
                shape: 'circle',
                isStatic: true
            })
            .setMass(CONSTS.ball.mass)
            .setBounce(CONSTS.ball.bounce)
            .setInteractive()
            .on('pointerdown', function() {
                this.setStatic(false);
                // this.matter.world.enabled = true;
            })
    );
}

function setupWorldBounds() {
    var bounds = this.matter.world.setBounds(
        0,
        0,
        this.game.config.width,
        this.game.height
    );

    bounds.walls.bottom.label = CONSTS.world.walls.bottomKey;
}

function isBallCollideBottom(bodyA, bodyB) {
    return (
        (bodyA.label === CONSTS.world.walls.bottomKey &&
            bodyB.label === CONSTS.ball.key) ||
        (bodyB.label === CONSTS.world.walls.bottomKey &&
            bodyA.label === CONSTS.ball.key)
    );
}

function addCollisionHandler() {
    this.matter.world.on(
        'collisionstart',
        function(event, bodyA, bodyB) {
            if (isBallCollideBottom(bodyA, bodyB)) {
                console.debug('ball->bottom');
            }

            if (
                (bodyA.label === 'ball' && bodyB.label === 'answer') ||
                (bodyA.label === 'answer' && bodyB.label === 'ball')
            ) {
                console.debug(`boom ${bodyA._answerId}`);

                bodyA.gameObject.setTint(0xff0000);
                // bodyA.gameObject.setAngularVelocity(0.55);
            }
        },
        this
    );
}

var LoadScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function LoadScene() {
        Phaser.Scene.call(this, { key: CONSTS.loadScene.key });
    },

    preload: function() {
        this.load.image(CONSTS.backgound.key, CONSTS.backgound.url);
        this.load.image(CONSTS.ball.key, CONSTS.ball.url);
        this.load.image(CONSTS.answerBlock.key, CONSTS.answerBlock.url);
        this.load.image(CONSTS.answerBase.key, CONSTS.answerBase.url);
        this.load.image(CONSTS.buttons.start.key, CONSTS.buttons.start.url);
    },

    create: function() {
        addBackground.bind(this)();
        showInstructionsText.bind(this)();
        addAnswerBoxes.bind(this)();
        this.scene.start(CONSTS.gameScene.key);
    }
});

var GameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function GameScene() {
        Phaser.Scene.call(this, { key: CONSTS.gameScene.key });
    },

    preload: function() {},

    create: function() {
        // this.matter.world.enabled = false;
        setupWorldBounds.bind(this)();
        addBackground.bind(this)();
        addAnswerBoxes.bind(this)();
        addBall.bind(this)();
        addCollisionHandler.bind(this)();

        var graphics = this.add.graphics();
        var curves = [];
        var curve = null;

        var size = 5;
        var lineCategory = this.matter.world.nextCategory();
        var distance = size / 2;
        var stiffness = 1;
        var lastPosition = new Phaser.Math.Vector2();
        var options = {
            friction: 0,
            frictionAir: 0,
            restitution: 0,
            ignoreGravity: true,
            inertia: Infinity,
            isStatic: true,
            angle: 0,
            collisionFilter: { category: lineCategory }
        };

        this.input.on(
            'pointerdown',
            function(pointer) {
                lastPosition.x = pointer.x;
                lastPosition.y = pointer.y;
                curve = new Phaser.Curves.Spline([pointer.x, pointer.y]);
                curves.push(curve);
            },
            this
        );

        this.input.on(
            'pointermove',
            function(pointer) {
                if (pointer.isDown) {
                    var x = pointer.x;
                    var y = pointer.y;
                    var dist = Phaser.Math.Distance.Between(
                        x,
                        y,
                        lastPosition.x,
                        lastPosition.y
                    );

                    if (dist > distance) {
                        options.angle = Phaser.Math.Angle.Between(
                            x,
                            y,
                            lastPosition.x,
                            lastPosition.y
                        );

                        this.matter.add.rectangle(x, y, dist, 1, options);
                        lastPosition.x = x;
                        lastPosition.y = y;

                        curve.addPoint(x, y);

                        graphics.clear();
                        graphics.lineStyle(5, 0xff00ff, 1.0);

                        curves.forEach(function(c) {
                            c.draw(graphics, 64);
                        });
                    }
                }
            },
            this
        );
    }
});

var config = {
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

console.debug(config);
var game = new Phaser.Game(config);
