import Phaser from 'phaser';
import { CONSTS } from '../consts';
import { EddySdk } from 'eddy-web-sdk';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: CONSTS.gameScene.key });
    }
    init() {
        EddySdk.gameLoaded(CONSTS.gameName);
        this.gameBodies = [];
        this.restartStarted = false;
        this.curves = [];
        this.curve = null;
        this.noCollisionTimer = null;
        this.question = {};
        this.answers = [];
        this.questionTextContainer = null;
    }
    preload() {
        this.load.image(CONSTS.backgound.key, CONSTS.backgound.url);
        this.load.image(CONSTS.ball.key, CONSTS.ball.url);
        this.load.image(CONSTS.answerBlock.key, CONSTS.answerBlock.url);
        this.load.image(CONSTS.answerBase.key, CONSTS.answerBase.url);
        this.load.image(CONSTS.buttons.start.key, CONSTS.buttons.start.url);
    }

    create() {
        this.lineCategory = this.matter.world.nextCategory();
        this.addBackground();
        this.setupWorldBounds();
        this.addCollisionHandler();
        this.addDrawLine();
        this.addQuestionContainer();
        this.restartGame();
    }
    addQuestionContainer() {
        this.questionTextContainer = this.add
            .text(
                this.game.config.width * 0.5,
                CONSTS.question.startY,
                '',
                CONSTS.question.fontStyle
            )
            .setOrigin(0.5);
    }
    addBackground() {
        const bgScaleWidth = this.game.config.width / CONSTS.backgound.width;
        const bgScaleHeight = this.game.config.height / CONSTS.backgound.height;

        this.add
            .image(0, 0, CONSTS.backgound.key)
            .setOrigin(0)
            .setScale(bgScaleWidth, bgScaleHeight);
    }
    setupWorldBounds() {
        const bounds = this.matter.world.setBounds(
            0,
            0,
            this.game.config.width,
            this.game.height
        );

        bounds.walls.bottom.label = CONSTS.world.walls.bottomKey;
    }
    addAnswerBoxes() {
        var startX = this.game.config.width / (this.answers.length + 1);
        var positionY =
            this.game.config.height -
            CONSTS.answerBase.count * CONSTS.answerBase.height -
            CONSTS.answerBlock.height * 0.5 +
            1;
        for (var i = 0; i < this.answers.length; i++) {
            var positionX = startX + i * startX;
            this.addAnswersBase(positionX);
            this.gameBodies.push(
                this.matter.add
                    .image(positionX, positionY, CONSTS.answerBlock.key, null, {
                        label: CONSTS.answerBlock.key,
                        collisionFilter: { category: this.lineCategory },
                        __answer: this.answers[i],
                        __answerTextObject: null
                    })
                    .setOrigin(0.5, 0.5)
                    .setMass(CONSTS.answerBlock.mass)
                    .setBounce(CONSTS.answerBlock.bounce)
            );
            this.addAnswerBody(positionX, positionY, this.answers[i]);
        }
    }
    addAnswersBase(positionX) {
        var baseStartY =
            this.game.config.height - CONSTS.answerBase.height * 0.5;
        for (var j = 0; j < CONSTS.answerBase.count; j++) {
            this.gameBodies.push(
                this.matter.add
                    .image(
                        positionX,
                        baseStartY - j * CONSTS.answerBase.height,
                        CONSTS.answerBase.key,
                        null,
                        {
                            label: CONSTS.answerBase.key
                        }
                    )
                    .setOrigin(0.5, 0.5)
                    .setMass(CONSTS.answerBase.mass)
                    .setBounce(CONSTS.answerBase.bounce)
            );
        }
    }
    addAnswerBody(positionX, positionY, answer) {
        if (answer && answer.text) {
            this.gameBodies.push(
                this.add
                    .text(
                        positionX,
                        positionY,
                        answer.text,
                        CONSTS.answer.fontStyle
                    )
                    .setOrigin(0.5)
                    .setScale(1, 1)
            );
            return null;
        } else {
            console.debug('Answer has no text');
            return null;
        }
    }
    addBall() {
        var positionX =
            CONSTS.ball.width * 0.5 +
            Math.floor(
                Math.random() *
                    (this.game.config.width - CONSTS.ball.width * 1.5)
            );
        var postionY = CONSTS.question.startY + 1.2 * CONSTS.ball.height;

        this.gameBodies.push(
            this.matter.add
                .image(positionX, postionY, CONSTS.ball.key, null, {
                    label: CONSTS.ball.key,
                    shape: 'circle'
                    //  isStatic: true
                })
                .setMass(CONSTS.ball.mass)
                .setBounce(CONSTS.ball.bounce)
                .setInteractive()
                .on(
                    'pointerdown',
                    function() {
                        this.matter.world.enabled = true;
                        const self = this;
                        this.noCollisionTimer = setTimeout(() => {
                            self.restartGame.bind(self)();
                        }, CONSTS.restartGameTimer.noCollision);
                    },
                    this
                )
        );
    }

    addGameEndText(text, style) {
        this.gameBodies.push(
            this.add
                .text(
                    this.game.config.width * 0.5,
                    this.game.config.height * 0.4,
                    text,
                    style
                )
                .setOrigin(0.5)
                .setScale(1, 1)
        );
    }

    addCollisionHandler() {
        this.matter.world.on(
            'collisionstart',
            function(event, bodyA, bodyB) {
                if (this.restartStarted) return;

                if (this.isBallCollideBottom(bodyA, bodyB)) {
                    this.gameOver();
                }
                if (this.isBallCollideAnswer(bodyA, bodyB)) {
                    if (bodyA.label === CONSTS.answerBlock.key)
                        this.checkAnswer(bodyA.__answer);
                    else this.checkAnswer(bodyB.__answer);
                }
            },
            this
        );
    }

    checkAnswer(answer) {
        console.debug(answer);
        const correct = EddySdk.checkAnswer(answer);
        this.gameOver(correct);
    }

    gameOver(isSuccess) {
        const style = Object.assign({}, CONSTS.answer.fontStyle);

        if (!(typeof isSuccess === 'undefined')) {
            style.fill = isSuccess ? '#00FF00' : '#FF0000';
            this.addGameEndText(isSuccess ? 'Yeppp' : 'Ups...', style);
        } else this.addGameEndText('Game over', style);
        const self = this;
        this.restartStarted = true;
        setTimeout(() => {
            self.restartGame.bind(self)();
        }, CONSTS.restartGameTimer.collision);
    }

    isBallCollideAnswer(bodyA, bodyB) {
        return (
            (bodyA.label === CONSTS.answerBlock.key &&
                bodyB.label === CONSTS.ball.key) ||
            (bodyB.label === CONSTS.answerBlock.key &&
                bodyA.label === CONSTS.ball.key)
        );
    }

    isBallCollideBottom(bodyA, bodyB) {
        return (
            (bodyA.label === CONSTS.world.walls.bottomKey &&
                bodyB.label === CONSTS.ball.key) ||
            (bodyB.label === CONSTS.world.walls.bottomKey &&
                bodyA.label === CONSTS.ball.key)
        );
    }
    addDrawLine() {
        var size = 5;
        // var lineCategory = this.matter.world.nextCategory();
        var distance = size / 2;
        var lastPosition = new Phaser.Math.Vector2();
        var options = {
            friction: 0,
            frictionAir: 0,
            restitution: 0,
            ignoreGravity: true,
            inertia: Infinity,
            isStatic: true,
            angle: 0,
            collisionFilter: { category: this.lineCategory }
        };
        this.graphics = this.add.graphics();
        this.input.on(
            'pointerdown',
            function(pointer) {
                lastPosition.x = pointer.x;
                lastPosition.y = pointer.y;
                this.curve = new Phaser.Curves.Spline([pointer.x, pointer.y]);
                this.curves.push(this.curve);
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

                        this.gameBodies.push(
                            this.matter.add.rectangle(x, y, dist, 1, options)
                        );
                        lastPosition.x = x;
                        lastPosition.y = y;

                        this.curve.addPoint(x, y);

                        this.graphics.clear();
                        this.graphics.lineStyle(5, 0xff00ff, 1.0);
                        const gr = this.graphics;

                        this.curves.forEach(function(c) {
                            c.draw(gr, 64);
                        }, this);
                    }
                }
            },
            this
        );
    }

    showQuestion() {
        if (this.question && this.question.isText()) {
            this.questionTextContainer.text = this.question.text();
        }
    }

    restartGame() {
        this.gameBodies.forEach(body => {
            if (body.destroy) body.destroy();
            else {
                this.matter.world.remove(body);
            }
        });

        this.eddyData();

        this.gameBodies = [];
        this.graphics.clear();
        this.curves = [];
        this.restartStarted = false;
        clearTimeout(this.noCollisionTimer);
        this.addAnswerBoxes();
        this.addBall();

        this.matter.world.enabled = false;

        this.showQuestion();
    }

    eddyData() {
        this.question = EddySdk.getQuestion();
        this.answers = this.question.answers();
    }
}
