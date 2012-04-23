/******************************************************************************* 
 * 
 * Copyright 2012 Bess Siegal
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

PENNY = 'penny.png';
NICKEL = 'nickel.png';
DIME = 'dime.png';
QUARTER = 'quarter.png';
PIGGY = 'piggybank-555px.png';
IMG_FILES = [PENNY, NICKEL, DIME, QUARTER, PIGGY];
PIGGY_ASPECT_RATIO = 555/574;
SLOT_TOLERANCE_Y = 75;
SLOT_TOLERANCE_X = 35;
PIGGY_WIDTH = 300;
PIGGY_HEIGHT = PIGGY_WIDTH / PIGGY_ASPECT_RATIO;
PADDING = 50;
STAGE_WIDTH = 1000;
STAGE_HEIGHT = 600;
CENTERX = STAGE_WIDTH / 2;
CENTERY = STAGE_HEIGHT / 2;
THOUGHT_WIDTH = STAGE_WIDTH - 4 * PADDING;
THOUGHT_HEIGHT = STAGE_HEIGHT - PIGGY_HEIGHT - 2 * PADDING;
COIN_PADDING = 4;
QUARTER_WIDTH = 58;
BUBBLES = 8;

function Piggy(/*String*/ label, /*int*/ x) {
    this.x = x;
    this.y = STAGE_HEIGHT - PIGGY_HEIGHT;
    this.slotPosition = {x: x + PIGGY_WIDTH / 2 - 3, y : this.y};
    this.runningTotal = 0;
    this.label = label;
    this.thoughtShowing = false;
    
    this.init = function() {
        
        var group = new Kinetic.Group();
        
        /*
         * Draw the piggy
         */
        var piggy = new Kinetic.Image({        
            x: x,
            y: this.y,
            width: PIGGY_WIDTH,
            height: PIGGY_HEIGHT,
            image: PiggyBanks.images[PIGGY],
            name: label
        });
        var thiz = this;
        group.add(piggy);
        
        
        /*
         * Add the label as a text
         */
        var text = new Kinetic.Text({
            x: x + 2 * PIGGY_WIDTH / 3,
            y: STAGE_HEIGHT - PIGGY_HEIGHT / 2,
            fontSize: 18,
            fontFamily: 'Calibri',
            textFill: 'black',
            align: 'center',
            verticalAlign: 'middle',
            text: label
        });
        group.add(text);
        
        /*
         * Add the value text
         */
        var cents = new Kinetic.Text({
            x: x + 2 * PIGGY_WIDTH / 3,
            y: STAGE_HEIGHT - PIGGY_HEIGHT / 2 + 18,
            fontSize: 15,
            fontFamily: 'Calibri',
            textFill: 'black',
            padding: 7,
            align: 'center',
            verticalAlign: 'middle',
            text: ''
        });
        this.cents = cents;
        group.add(cents);
        
        PiggyBanks.piggyLayer.add(group);

        /*
         * mouseover touchstart to see piggy coin contents
         */
        group.on('mouseover touchstart', function() {            
            PiggyBanks.consoleLog('piggy mouseover/touchstart...');
            PiggyBanks.clearThought();
            PiggyBanks.thoughtTimer = setTimeout(function() {
                thiz.showThought();
            }, 1500);
        });
        /*
         * mouseout touchend to remove thought bubble of piggy
         * and you see its contents
         */
        group.on('mouseout touchend', function() {
            PiggyBanks.consoleLog('piggy mouseout/touchend...');
            PiggyBanks.clearThought();
        });
        this.piggyGroup = group;
        
        this.initCoinsGroup();
    };
    
    this.initCoinsGroup = function() {
        /*
         * Add the coins group
         */        
        this.coins = new Kinetic.Group();
        var container = new Kinetic.RoundedRect({
            cornerX: CENTERX - THOUGHT_WIDTH / 2,
            cornerY: PADDING,
            width: THOUGHT_WIDTH,
            height: THOUGHT_HEIGHT,
            radius: 30, 
            fill: '#f9f685', 
            stroke: 'black',
            strokeWidth: 4,
            name: 'container'
        });
        this.coins.add(container);        
        
        for (var i = 0; i < BUBBLES; i++) {
            var bubble = new Kinetic.RoundedRect({
                cornerX: this.x + 100 + i * (CENTERX - this.x - 100) / BUBBLES,
                cornerY: this.y + 70 + i * (container.attrs.cornerY + THOUGHT_HEIGHT - this.y - 70) / BUBBLES,
                radius: 5,
                height: 10,
                width: 10 + i * 2,
                fill: '#f9f685',
                stroke: 'black',
                strokeWidth: 2
            });
            this.coins.add(bubble);            
        }
        
        this.coins.hide();
        PiggyBanks.bankLayer.add(this.coins);
        PiggyBanks.bankLayer.draw();
    };
    
    this.reInit = function() {
        this.runningTotal = 0;
        
        PiggyBanks.bankLayer.remove(this.coins);
        this.initCoinsGroup();
    };
    
    this.showThought = function() {
        this.thoughtShowing = true;
        this.organizeCoins();
        this.coins.moveTo(PiggyBanks.dragLayer);
        this.coins.show();
        var children = this.coins.getChildren();
        for (var i = 0, len = children.length; i < len; i++) {
            children[i].show();
        }
        PiggyBanks.dragLayer.draw();
    };
    
    this.hideThought = function() {
        this.coins.moveTo(PiggyBanks.bankLayer);
        this.coins.hide();
        var children = this.coins.getChildren();
        for (var i = 0, len = children.length; i < len; i++) {
            children[i].hide();
        }
        PiggyBanks.bankLayer.draw();
        PiggyBanks.dragLayer.draw();   
        this.thoughtShowing = false;
    };
    
    this.setCents = function(/*int*/cents) {        
        this.value = cents;
        this.cents.attrs.text = PiggyBanks.centsToString(cents);
        PiggyBanks.piggyLayer.draw();
    };
    
    this.addCoin = function(/*Coin*/coin) {
        PiggyBanks.consoleLog('coin.value = ' + coin.value);
        /*
         * If the addition of the coin exceeds the cents
         * value, eject it
         */
        if (coin.value + this.runningTotal > this.value) {
            coin.coin.moveTo(PiggyBanks.coinLayer);
            PiggyBanks.dragLayer.draw();
            PiggyBanks.coinLayer.draw();
            coin.transitionBack();
            
        } else {
            this.runningTotal += coin.value;

            coin.coin.moveTo(PiggyBanks.bankLayer);
            this.coins.add(coin.coin);            
            PiggyBanks.bankLayer.draw();
            PiggyBanks.dragLayer.draw();

            coin.coin.transitionTo({
                y: coin.coin.attrs.y + 2 * PIGGY_HEIGHT / 3,
                duration: 0.5,
                callback: function() {
                    coin.coin.hide();
                }
            });
            
            PiggyBanks.consoleLog(this.label + ' runningTotal = ' + this.runningTotal);
            setTimeout(function() {
                PiggyBanks.checkComplete();
            }, 500);
        }
    };
    
    this.organizeCoins = function() {        
        var children = this.coins.getChildren();
        
        var container = this.coins.get('.container')[0];
        var x = container.attrs.cornerX + 2 * COIN_PADDING;
        var y = container.attrs.cornerY + COIN_PADDING + QUARTER_WIDTH / 2;
        
        for (var i = BUBBLES + 1; i < children.length; i++) {
            var c = children[i];
            
            c.attrs.x = x;
            x += c.attrs.imgWidth + COIN_PADDING;
            
            c.attrs.y = y - c.attrs.imgWidth / 2;
            
            if (x + QUARTER_WIDTH > container.attrs.cornerX + container.attrs.width - 2 * COIN_PADDING) {
                x = container.attrs.cornerX + 2 * COIN_PADDING;
                y += QUARTER_WIDTH + COIN_PADDING;
            }

        }
    };
    
    this.showMessage = function() {
        var text = new Kinetic.Text({
            x: CENTERX,
            y: CENTERY - PADDING,
            fontSize: 40,
            fontFamily: 'Calibri',
            textFill: 'black',
            align: 'center',
            verticalAlign: 'middle',
            text: 'Nice job!',
            padding: 30
        });
        PiggyBanks.dragLayer.add(text);
        PiggyBanks.dragLayer.draw();
        var container = new Kinetic.RoundedRect({
            cornerX: CENTERX - text.getTextWidth() / 2 - text.attrs.padding,
            cornerY: text.attrs.y - 50, //(fontSize + 2*padding) / 2
            width: text.getTextWidth() + 2 * text.attrs.padding,
            height: 100, //(fontSize + 2*padding)
            radius: 20, 
            fill: '#f9f685', 
            stroke: 'black',
            strokeWidth: 4,
            name: 'container'
        });
        PiggyBanks.dragLayer.add(container);
        text.moveToTop();
        PiggyBanks.dragLayer.draw();
        
        setTimeout(function() {
            //add play again
            var again = new Kinetic.Text({
                x: container.attrs.cornerX + container.attrs.width - 20,
                y: container.attrs.cornerY + container.attrs.height - 10,
                fontSize: 12,
                fontFamily: 'Calibri',
                textFill: 'black',
                align: 'right',
                verticalAlign: 'bottom',
                text: 'Play again',
                padding: 5,
                fill: 'pink',
                stroke: 'black',
                strokeWidth: 1            
            });
            
            again.on('mouseover', function() {
                document.body.style.cursor = 'pointer';
            });
            again.on('mouseout', function() {
                document.body.style.cursor = 'default';
            });
            again.on('click touchstart', function() {
                PiggyBanks.reInit();
            });
            text.on('mouseover', function() {
                document.body.style.cursor = 'pointer';
            });
            text.on('mouseout', function() {
                document.body.style.cursor = 'default';
            });
            text.on('click touchstart', function() {
                PiggyBanks.reInit();
            });
            
            PiggyBanks.dragLayer.add(again);
            PiggyBanks.dragLayer.draw();
            
        }, 6000);        
    };
    
    this.celebrate = function() {
        if (PiggyBanks.thoughtTimer) {
            clearTimeout(PiggyBanks.thoughtTimer);
        }
        document.body.style.cursor = 'default';

        PiggyBanks.piggyLayer.listen(false);
        PiggyBanks.coinLayer.listen(false);
        this.showMessage();
        var thiz = this;
        this.piggyGroup.transitionTo({
            y: -STAGE_HEIGHT / 2,
            duration: 3,
            easing: 'bounce-ease-in',
            callback: function() {
                thiz.piggyGroup.transitionTo({
                  y: 0,
                  duration: 3,
                  easing: 'elastic-ease-out'
                });
            }
        });

    };
    
    this.init();
};

function Coin(/*String*/ coinType) {
    
    this.value = 
        coinType === NICKEL ? 5 :
            coinType === DIME ? 10 :
                coinType === QUARTER ? 25 : 
                    1;
    this.width =
        coinType === NICKEL ? 55 :
            coinType === DIME ? 44 :
                coinType === QUARTER ? 58 : 
                    47;
    
    this.init = function() {
        //random location 
        var textBoxHeight = PiggyBanks.changeBreaker.attrs.height;
        var x = Math.floor(Math.random() * (STAGE_WIDTH - 2 * PADDING));
        var y = Math.floor(Math.random() * (STAGE_HEIGHT - PIGGY_HEIGHT - PADDING - textBoxHeight) + textBoxHeight);
        
        this.x = x;
        this.y = y;
        
        var coin = new Kinetic.Image({
            x: x,
            y: y,
            image: PiggyBanks.images[coinType],
            dragBounds: {
                bottom: STAGE_HEIGHT - PIGGY_HEIGHT - 30
            },
            imgWidth: this.width
        });
        
        var thiz = this;
        
        coin.on('mousedown touchstart', function() {
            PiggyBanks.consoleLog('mousedown touchstart...');
            coin.moveTo(PiggyBanks.dragLayer);
            coin.draggable(true);
//            PiggyBanks.coinLayer.listen(false); an accidental dblclick/dbltap would move to dragLayer but undraggable and unrecoverable since layer doesn't listen
            PiggyBanks.coinLayer.draw();
            PiggyBanks.dragLayer.draw();
            
            PiggyBanks.clearThought();
        });
        /*
         * check if coin is near a piggy bank slot
         * and if it is add it to the piggy
         */
        coin.on('dragend', function() {
            PiggyBanks.consoleLog('dragend...');
            var piggy = PiggyBanks.whichPiggy(thiz);
            if (piggy) {
                piggy.addCoin(thiz);
                coin.draggable(false);
            } else if (PiggyBanks.isMakeChange(thiz)) {
                coin.draggable(false);
                thiz.breakCoin();
            } else {
                //move back to the original layer
                coin.moveTo(PiggyBanks.coinLayer);
                thiz.x = coin.getAbsolutePosition().x;
                thiz.y = coin.getAbsolutePosition().y;
                PiggyBanks.coinLayer.draw();
                PiggyBanks.dragLayer.draw();
            }
//            PiggyBanks.coinLayer.listen(true); not needed since not calling listen(false)
            PiggyBanks.clearThought();
        });
        /*
         * change cursor on mouse events
         */
        coin.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });
        coin.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });
        coin.on('dragmove', function() {
            PiggyBanks.clearThought();
        });
        
        PiggyBanks.coinLayer.add(coin);
        this.coin = coin;
    };

    this.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
        this.coin.attrs.x = x;
        this.coin.attrs.y = y;
    };
    
    this.transitionBack = function(/*function*/callback) {
        this.coin.transitionTo({
            x: this.x,
            y: this.y,
            duration: 0.3,
            callback: callback
        });
    };
    
    this.breakCoin = function() {
        var thiz = this;
        this.transitionBack(function() {
            thiz.coin.moveTo(PiggyBanks.coinLayer);

            if (thiz.value !== 1) {
                var x = thiz.coin.getAbsolutePosition().x;
                var y = thiz.coin.getAbsolutePosition().y;
                
                switch (thiz.value) {
                    case 25:
                        var d1 = new Coin(DIME);
                        d1.setPosition(x, y);
                        var d2 = new Coin(DIME);
                        d2.setPosition(x + 10, y + 10);
                        var n = new Coin(NICKEL);
                        n.setPosition(x + 20, y + 20);
                        break;
                    case 10:
                        var n1 = new Coin(NICKEL);
                        n1.setPosition(x, y);
                        var n2 = new Coin(NICKEL);
                        n2.setPosition(x + 10, y + 10);
                        break;
                    case 5:
                        for (var i = 0; i < 5; i++) {
                            var p = new Coin(PENNY);
                            p.setPosition(x + i * 10, y + i * 10);
                        }
                        break;
                }
                thiz.coin.hide();
                PiggyBanks.coinLayer.remove(thiz.coin);                    
            }
            PiggyBanks.consoleLog('removing coin and redrawing layer');
            PiggyBanks.coinLayer.draw();
            PiggyBanks.dragLayer.draw();
        });
    };
    

    this.init();
};

var PiggyBanks = {
    debug: true,
    /* Kinetic.Stage - the stage */
    stage: null,
    /* Kinetic.Layer for piggy banks */
    piggyLayer: null,
    /* array of Piggy objects for spend, save, and give */
    piggies: [],
    /* Kinetic.Layer for scattered coins */
    coinLayer: null,
    /* Kinetic.Layer for dragging coins */
    dragLayer: null,
    /* Kinetic.Layer for coins added to the piggy banks*/
    bankLayer: null,
    /* map of file name to Image */
    images: {},
    /* save Piggy */
    save: null,
    /* spend Piggy */
    spend: null,
    /* give Piggy */
    give: null,
    /* timer for piggy thought bubble */
    thoughtTimer: null,
    /* Kinetic.RoundedRect for breaking a coin into smaller coins */
    changeBreaker: null,
    
    init: function() {
        PiggyBanks.loadImages();
        PiggyBanks.stage = new Kinetic.Stage({container: 'game', width: STAGE_WIDTH, height: STAGE_HEIGHT});
               
    },    
        
    loadImages: function() {
        PiggyBanks.consoleLog('loadImages');
        PiggyBanks.loadedImages = 0;
        for (var i = 0; i < IMG_FILES.length; i++) {
            var src = IMG_FILES[i];
            var img = new Image();
            img.onload = function() {
                PiggyBanks.consoleLog('img.onload loadedImages = ' + PiggyBanks.loadedImages);
                PiggyBanks.consoleLog('img.onload IMG_FILES.length - 1 = ' + (IMG_FILES.length - 1));
                if (++PiggyBanks.loadedImages === IMG_FILES.length) {
                    PiggyBanks.initLayers();
                }
            };
            img.src = src;
            PiggyBanks.images[src] = img;
        }
    },
    
    resize: function() {
        /*
         * STAGE_WIDTH is fixed at 1000 (on mobile, it's fixed by viewport)
         * STAGE_HEIGHT is min 600
         */
        
    },
    
    initLayers: function() {
        PiggyBanks.consoleLog('initLayers');
        PiggyBanks.bankLayer = new Kinetic.Layer({
            listening: false
        });
        PiggyBanks.stage.add(PiggyBanks.bankLayer);

        PiggyBanks.piggyLayer = new Kinetic.Layer();  
        PiggyBanks.initPiggyLayer();
        
        PiggyBanks.coinLayer = new Kinetic.Layer();
        PiggyBanks.initCoins();
        PiggyBanks.stage.add(PiggyBanks.coinLayer);
        
        PiggyBanks.dragLayer = new Kinetic.Layer();
        PiggyBanks.stage.add(PiggyBanks.dragLayer);
    },
    
    initPiggyLayer: function() {
        
        PiggyBanks.spend = new Piggy('Spend', 0);
        PiggyBanks.piggies.push(PiggyBanks.spend);
        PiggyBanks.save = new Piggy('Save', PIGGY_WIDTH + PADDING);
        PiggyBanks.piggies.push(PiggyBanks.save);
        PiggyBanks.give = new Piggy('Give', 2 * (PIGGY_WIDTH + PADDING)); 
        PiggyBanks.piggies.push(PiggyBanks.give);

        /*
         * Add a spot for making change
         */
        var text = new Kinetic.Text({
            x: STAGE_WIDTH - 25,
            y: 5,
            text: 'Need change?',
            fontSize: 15,
            fontFamily: 'Calibri',
            textFill: 'black',
            align: 'right',
            verticalAlign: 'top',
            padding: 20,
            lineJoin: 'round'
        });
        PiggyBanks.piggyLayer.add(text);    

        //must add to stage before the text width can be determined
        PiggyBanks.stage.add(PiggyBanks.piggyLayer);
        //give it a nice rounded corner background
        var changeBreakerWidth = text.getTextWidth() + text.attrs.padding * 2;
        var changeBreakerHeight = text.getTextHeight() + text.attrs.padding * 2;
        
        PiggyBanks.changeBreaker = new Kinetic.RoundedRect({
            cornerX: STAGE_WIDTH - changeBreakerWidth - 5,
            cornerY: 5,
            fill: '#ebc4ec',
            stroke: 'black',
            strokeWidth: 2,
            width: changeBreakerWidth,
            height: changeBreakerHeight,
            radius: 30
         });
        PiggyBanks.piggyLayer.add(PiggyBanks.changeBreaker);
        text.moveToTop();


    },
    
    initCoins: function() {
        /* random number of each coin 0 - level */
        var level = 10;
        var total = 0;
        var c;
        for (var i = 0, len = Math.floor(Math.random() * level); i < len; i++) {
            c = new Coin(QUARTER);
            total += c.value;
        }
        for (var i = 0, len = Math.floor(Math.random() * level); i < len; i++) {
            c = new Coin(DIME);
            total += c.value;
        }
        for (var i = 0, len = Math.floor(Math.random() * level); i < len; i++) {
            c = new Coin(NICKEL);
            total += c.value;
        }
        for (var i = 0, len = Math.floor(Math.random() * level); i < len; i++) {
            c = new Coin(PENNY);
            total += c.value;
        }
        
        //total must be divide evenly by 4?
        var mod = total % 4;
        PiggyBanks.consoleLog('total = ' + total);
        PiggyBanks.consoleLog('mod = ' + mod);
        if (mod !== 0) {
            for (var i = 0, len = 4 - mod; i < len; i++) {
                c = new Coin(PENNY);
                total += c.value;
                PiggyBanks.consoleLog('total = ' + total);
            }
        }
        
        $('#earned').html(PiggyBanks.centsToString(total));
        PiggyBanks.spend.setCents(total / 2);
        PiggyBanks.save.setCents(total / 4);
        PiggyBanks.give.setCents(total / 4);
        
    },
    
    centsToString: function(/*int*/ cents) {
        var dol = cents / 100;
        var str = '$' + dol;
        /*
         * add 0 if necessary
         */
        var decLoc = str.indexOf('.');
        var dec = str.substring(decLoc + 1);
        if (dec.length < 2) {
            str = str + '0';
        } 
        return str;
    },
    
    whichPiggy: function(/*Coin*/ coin) {
        /*
         * Test all the piggies.  If it is close to the top/middle of one
         * return that one.        
         */
        var a = coin.coin.getAbsolutePosition();

        for (var i = 0; i < PiggyBanks.piggies.length; i++) {
            PiggyBanks.consoleLog('a.x = ' + a.x + ', a.y = ' + a.y);
            var o = PiggyBanks.piggies[i].slotPosition;
            PiggyBanks.consoleLog('i = ' + i + ': o.x = ' + o.x + ', o.y = ' + o.y);
            if (a.x > o.x - SLOT_TOLERANCE_X && a.x < o.x + SLOT_TOLERANCE_X && a.y > o.y - SLOT_TOLERANCE_Y) {                
                return PiggyBanks.piggies[i];
            }
        }
        return null;
    },
    
    isMakeChange: function(/*Coin*/ coin) {
        var a = coin.coin.getAbsolutePosition();
        /*
         * anywhere in the corner where the changeBreaker text is
         */
        if (a.x > STAGE_WIDTH - PiggyBanks.changeBreaker.attrs.cornerX && a.y < PiggyBanks.changeBreaker.attrs.height) { 
            PiggyBanks.consoleLog('isMakeChange true');
            return true;        
        }
        PiggyBanks.consoleLog('isMakeChange false');
        return false;
    },
    
    checkComplete: function() {
        /*
         * If each piggy's runningTotal matches its value,
         * game is done!
         */
        var done = true;
        for (var i = 0; i < PiggyBanks.piggies.length; i++) { 
            var p = PiggyBanks.piggies[i];
            if (p.runningTotal !== p.value) {
                done = false;
                break;
            }
        }
        
        if (done) {
            for (var i = 0; i < PiggyBanks.piggies.length; i++) {
                var p = PiggyBanks.piggies[i];
                p.celebrate();
            }
        }
    },
        
    clearThought: function() {
        PiggyBanks.consoleLog('clearThought...');
        if (PiggyBanks.thoughtTimer) {
            clearTimeout(PiggyBanks.thoughtTimer);
        }
        for (var i = 0; i < PiggyBanks.piggies.length; i++) { 
            var p = PiggyBanks.piggies[i];
            if (p.thoughtShowing) {
                p.hideThought();
            }
        }
    },
    
    reInit: function() {
//        window.location.reload();
        
        /*
         * for each piggy, remove coins from group (clearing most of bankLayer)
         * 
         * 
         */
        for (var i = 0; i < PiggyBanks.piggies.length; i++) {
            PiggyBanks.piggies[i].reInit();            
        }
        PiggyBanks.bankLayer.draw();
        /*
         * clear coin layer and re-initialize
         */
        PiggyBanks.coinLayer.removeChildren();
        PiggyBanks.initCoins();
        PiggyBanks.coinLayer.draw();
        
        /*
         * clear dragLayer
         */
        PiggyBanks.dragLayer.removeChildren();
        PiggyBanks.dragLayer.draw();
        
        PiggyBanks.piggyLayer.listen(true);
        PiggyBanks.coinLayer.listen(true);
    },
    
    about: function(show) {
        if (show) {
            $('#about').slideDown();
        } else {
            $('#about').slideUp();
        }
    },
    
    toggleAbout: function() {
        if ($('#about').is(':visible')) {
            PiggyBanks.about(false);
        } else {
            PiggyBanks.about(true);
        }
    },
    
    consoleLog: function(msg) {
        if (PiggyBanks.debug && console && console.log) {
            console.log(msg);
        }
    }

};

$(function() {
    $('html').click(function() {
        if ($('#about').is(':visible')) {
            $('#about').slideUp();
        }
    });

    $(window).resize(function() {
        PiggyBanks.resize();
    });
    
    PiggyBanks.init();
});