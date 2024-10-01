// game/Math.js
var M = class {
  /**
   * @param {number[]} a 
   * @param {number[]} b
   */
  static add(a, b) {
    return a.map((v, i) => v + b[i]);
  }
  /**
   * @param {number[]} a 
   * @param {number[]} b
   */
  static sub(a, b) {
    return a.map((v, i) => v - b[i]);
  }
  /**
   * @param {number[]} val
   * @param {number} scale
   */
  static mul(val, scale) {
    return val.map((v) => v * scale);
  }
  /**
   * @param {number[]} val
   * @param {number} scale
   */
  static div(val, scale) {
    return val.map((v) => v / scale);
  }
  /**
   * @param {number[]} a
   * @param {number[]} b
   * @param {(a:number,b:number)=>number} fn
   */
  static map(a, b, fn) {
    return a.map((v, i) => {
      return fn(v, b[i]);
    });
  }
  /**
   * @param {number} val
   */
  static deg2rad(val) {
    return val * Math.PI / 180;
  }
  /**
   * @param {number} val
   */
  static rad2deg(val) {
    return val * 180 / Math.PI;
  }
};

// game/SceneDebugger.js
var SceneDebugger = class {
  #dom;
  #ctx;
  set enable(val) {
    this.#dom.hidden = !val;
  }
  get enable() {
    return !this.#dom.hidden;
  }
  actorDebug = false;
  pointSize = 5;
  /**
   * @param {Scene} scene 
   */
  constructor(scene) {
    this.#dom = document.createElement("canvas");
    this.#dom.width = scene._dom.clientWidth * window.devicePixelRatio;
    this.#dom.height = scene._dom.clientHeight * window.devicePixelRatio;
    this.#dom.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width:100%;
      height:100%;
      z-index: 100;
    `;
    this.#ctx = this.#dom.getContext("2d");
    this.#ctx.font = "20px monospace";
    this.scene = scene;
    this.scene._dom.appendChild(this.#dom);
  }
  draw() {
    if (!this.enable) return;
    this.#ctx.clearRect(0, 0, this.#dom.width, this.#dom.height);
    if (this.actorDebug) {
      this.#drawBounding();
      this.#drawDirection();
    }
  }
  #drawBounding() {
    for (let actor of this.scene.actors) {
      this.drawRect(
        actor.x - actor.w * 0.5,
        actor.y - actor.h * 0.5,
        actor.x + actor.w - actor.w * 0.5,
        actor.y + actor.h - actor.h * 0.5,
        "#f00"
      );
    }
  }
  #drawDirection() {
    for (let actor of this.scene.actors) {
      let dir = actor.getDirection(0);
      dir = M.mul(dir, Math.sqrt(actor.w * actor.h));
      let to = M.add([actor.x, actor.y], dir);
      this.drawLine(actor.x, actor.y, ...to, "#0f0");
    }
  }
  drawRect(x1, y1, x2, y2, color) {
    let wsiz = [this.#dom.width, this.#dom.height];
    let a = this.scene.pos2sceneRatio([x1, y1]);
    let b = this.scene.pos2sceneRatio([x2, y2]);
    a = M.map(a, wsiz, (a2, b2) => a2 * b2);
    b = M.map(b, wsiz, (a2, b2) => a2 * b2);
    let style = this.#ctx.strokeStyle;
    this.#ctx.strokeStyle = color;
    this.#ctx.strokeRect(...a, ...M.sub(b, a));
    this.#ctx.strokeStyle = style;
  }
  drawLine(x1, y1, x2, y2, color) {
    let wsiz = [this.#dom.width, this.#dom.height];
    let a = this.scene.pos2sceneRatio([x1, y1]);
    let b = this.scene.pos2sceneRatio([x2, y2]);
    a = M.map(a, wsiz, (a2, b2) => a2 * b2);
    b = M.map(b, wsiz, (a2, b2) => a2 * b2);
    let style = this.#ctx.strokeStyle;
    this.#ctx.strokeStyle = color;
    this.#ctx.beginPath();
    this.#ctx.moveTo(...a);
    this.#ctx.lineTo(...b);
    this.#ctx.closePath();
    this.#ctx.stroke();
    this.#ctx.strokeStyle = style;
  }
};

// game/Scene.js
var Scene = class {
  #width = 100;
  #height = 100;
  /** 上次更新时间 (s)
   * @type{number}
   **/
  deltaTime = 0;
  get width() {
    return this.#width;
  }
  set width(val) {
    this.#width = val;
  }
  get height() {
    return this.#height;
  }
  set height(val) {
    this.#height = val;
  }
  /** @type {Actor[]} */
  actors = [];
  constructor(width = 100) {
    this.width = width;
    this._dom = document.createElement("div");
    this._dom.style.cssText = `
      position: relative;
      width: 100vw;
      height: 100vh;
      image-rendering: pixelated;
      overflow : hidden;
      color-scheme: only light;
    `;
    document.body.appendChild(this._dom);
    this.height = this._dom.clientHeight / this._dom.clientWidth * width;
    this.debugger = new SceneDebugger(this);
  }
  /**
   * @param {Actor} actor 
   */
  addActor(actor, updateActor = true) {
    if (!this.actors.includes(actor)) {
      this.actors.push(actor);
    }
    if (updateActor) {
      actor.setScene(this, false);
    }
  }
  /**
   * @param {Actor} actor
   */
  removeActor(actor, updateActor = true) {
    this.actors = this.actors.filter((a) => a != actor);
    if (updateActor) {
      actor.remove(this, false);
    }
  }
  #prev = -1;
  update() {
    let now = 0;
    if (this.#prev == -1) {
      this.#prev = performance.now() / 1e3;
    }
    now = performance.now() / 1e3;
    this.deltaTime = now - this.#prev;
    this.actors.forEach((actor) => actor._update());
    this.debugger.draw();
    this.#prev = now;
  }
  clearTime() {
    this.#prev = -1;
  }
  updateDom() {
    this.actors.forEach((a) => a._updatedDom());
  }
  /**
   * @param {[number,number]} pos
   * */
  pos2sceneRatio(pos) {
    return [
      pos[0] / this.width + 0.5,
      pos[1] / -this.height + 0.5
    ];
  }
  /**
   * @param {[number,number]} size
   */
  size2sceneRatio(size) {
    return [
      size[0] / this.width,
      size[1] / this.height
    ];
  }
};

// game/Actor.js
var Actor = class {
  x = 0;
  y = 0;
  w = 0;
  h = 0;
  z = 0;
  rotation = 0;
  // 旋转偏移量
  offRot = 0;
  visible = true;
  active = true;
  _dom;
  /**
   * @param {Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._init();
    if (!scene) {
      throw `${this.constructor.name}::constructor scene\u4E0D\u80FD\u4E3Aundefined`;
    }
    this.setScene(scene);
  }
  _init() {
    this.init();
  }
  _update() {
    if (this.active) {
      this.update();
    }
    if (this._dom) {
      this._dom.style.zIndex = this.z;
    }
  }
  _updatedDom() {
    this._dom.hidden = !this.visible;
    this.updateDom();
  }
  init() {}
  update() {}
  updateDom() {}
  /**
   * 获取方向向量(顺时针旋转deg度)
   * @param {number} deg
   */
  getDirection(deg) {
    return [
      Math.sin(M.deg2rad(this.rotation + this.offRot + deg)),
      Math.cos(M.deg2rad(this.rotation + this.offRot + deg))
    ];
  }
  /**
   * @param {Scene} scene 
   */
  setScene(scene, updateScene = true) {
    this.scene = scene;
    this.scene._dom.appendChild(this._dom);
    if (updateScene) {
      scene.addActor(this, false);
    }
  }
  /**
   * @param {Scene} scene 
   */
  remove(updateScene = true) {
    if (updateScene) {
      this.scene.removeActor(this, false);
    }
    this.scene = void 0;
    this._dom.remove();
  }
  /**
   * @param x1 {number}
   * @param y1 {number}
   * @returns {Actor[]}
   */
  pointCast(actors, x1, y1) {
    for (let actor of actors) {
      let s = [actor.w, actor.h];
      let ax = [
        actor.x - s[0] * 0.5,
        actor.x + s[0] - s[0] * 0.5
      ];
      let ay = [
        actor.y - s[1] * 0.5,
        actor.y + s[1] - s[1] * 0.5
      ];
      let min = [
        Math.min(...ax),
        Math.min(...ay)
      ];
      let max = [
        Math.max(...ax),
        Math.max(...ay)
      ];
      if (min[0] <= x1 && max[0] >= x1 && min[1] <= y1 && max[1] >= y1) {
        return actor;
      }
    }
    return null;
  }

  rayCast(actors, x1, y1, dirx, diry, distance, steps, debug = false) {
    let len = Math.sqrt(dirx * dirx + diry * diry);
    let nx = dirx / len;
    let ny = diry / len;
    let actor = null;
    for (let i = 0; i <= steps; i++) {
      actor = this.pointCast(
        actors,
        x1 + i * steps * distance * nx,
        y1 + i * steps * distance * ny
      );
      if (actor) break;
    }
    if (debug) {
      this.scene.debugger.drawLine(
        x1,
        y1,
        x1 + distance * steps * nx,
        y1 + distance * steps * ny,
        actor == null ? "#0f0" : "#f00"
      );
    }
    return actor;
  }
};

// game/PackedImage.js
var PackedImage = class _PackedImage {
  /**
   * @param {number} w 
   * @param {number} h 
   * @param {HTMLImageElement} image 
   */
  constructor(image) {
    this.image = image;
    this.w = image.width;
    this.h = image.height;
  }
  /**
   * @returns {Promise<PackedImage>}
   */
  static fromUrl(url) {
    let image = new Image();
    return new Promise((res) => {
      image.onload = () => {
        res(new _PackedImage(image));
      };
      image.onerror = () => {
        console.trace();
        throw "PackedImage::fromUrl \u56FE\u7247\u52A0\u8F7D\u5931\u8D25: " + url;
      };
      image.src = url;
    });
  }
};

// game/SoundPlayer.js
var SoundPlayer = class {
  offset = 0;
  constructor(url, count = 16) {
    this._audios = [];
    this.count = count;
    for (let i = 0; i < count; i++) {
      this._audios.push(new Audio(url));
    }
  }
  play() {
    this._audios[this.offset].play();
    this.offset++;
    this.offset %= this.count;
  }
  stopAll() {
    this._audios.forEach((au) => {
      au.pause();
      au.currentTime = 0;
    });
  }
};

// game/ResLoader.js
var ResourceLoader = class {
  /** @type {Map<string,PackedImage>} */
  static imageMap = /* @__PURE__ */ new Map();
  /**
   * @param {string[]} list 
   */
  static async loadImages(list) {
    for (let url of list) {
      this.imageMap.set(
        url,
        await PackedImage.fromUrl(url)
      );
    }
  }
  /**
   * @returns {PackedImage}
   */
  static getImage(url) {
    let res = this.imageMap.get(url);
    if (!res) {
      console.trace();
      throw "ResourceLoader::getImage " + url + " \u6CA1\u6709\u88AB\u52A0\u8F7D";
    }
    return this.imageMap.get(url);
  }
  /**
   * 加载音频
   * @param url {string}
   * @returns {HTMLAudioElement}
   */
  static loadAudio(url) {
    let audio = new Audio(url);
    return audio;
  }
  /**
   * 加载音效
   * @param {string} url 
   * @returns {SoundPlayer}
   */
  static loadSound(url, count = 16) {
    return new SoundPlayer(url, count);
  }
};

// game/Sprite.js
var Sprite = class extends Actor {
  set url(v) {
    this._dom.src = v;
  }
  /** @returns {string} */
  get url() {
    return this._dom.src;
  }
  flipX = false;
  flipY = false;
  _init() {
    this._dom = document.createElement("img");
    this._dom.style.cssText = `
    position:absolute;
    transform-origin: center center;
    `;
    super._init();
  }
  _update() {
    super._update();
  }
  updateDom() {
    if (!this.scene) return;
    if (!this.visible) return;
    this._dom.hidden = !this.visible;
    this._dom.src = this.url;
    let scene = this.scene;
    let [w, h] = scene.size2sceneRatio([this.w, this.h]);
    let [ox, oy] = scene.pos2sceneRatio([this.x, this.y]);
    let s = this._dom.style;
    s.width = `${w * 100}%`;
    s.height = `${h * 100}%`;
    s.left = `${100 * (ox - 0.5 * w)}%`;
    s.top = `${100 * (oy - 0.5 * h)}%`;
    s.transform = `
    rotate(${this.rotation}deg) 
    scale(${this.flipX ? -1 : 1},${this.flipY ? -1 : 1})
    `;
  }
  /**
   * @param {string} url
   * @param {number} pixScale
   */
  setImage(url, pixScale) {
    let img = ResourceLoader.getImage(url);
    if (!img) {
      throw url;
    }
    this.w = pixScale * img.w;
    this.h = pixScale * img.h;
    this.url = url;
  }
};

// bird/Bird.js
var Bird = class extends Sprite {
  vx = 0;
  vy = 0;
  init() {
    this.setImage("assets/sprites/bluebird-midflap.png", Game.pixScale);
    this.offRot = 90;
    this.z = 3;
  }
  #animTime = 0;
  #animIndex = 0;
  update() {
    if (Game.over) {
      this.x -= Game.pipeSpeed * this.scene.deltaTime;
    }
    if (!Game.playing) return;
    this.vy -= 9.8 * this.scene.deltaTime;
    this.x += this.vx * this.scene.deltaTime;
    this.y += this.vy * this.scene.deltaTime;
    this.rotation = Math.max(-40, Math.min(40, -this.vy * 10));
    this.y = Math.max(Game.getGroundY(), this.y);
    if (!Game.over) {
      this.updateAnimation();
    }
  }
  updateAnimation() {
    let anims = [
      "assets/sprites/bluebird-upflap.png",
      "assets/sprites/bluebird-midflap.png",
      "assets/sprites/bluebird-downflap.png"
    ];
    this.#animTime += this.scene.deltaTime;
    if (this.#animTime >= 0.1) {
      this.#animTime = 0;
      this.#animIndex++;
      this.#animIndex %= anims.length;
    }
    this.setImage(anims[this.#animIndex], Game.pixScale);
  }
  flyUp() {
    this.vy = 4;
  }
};

// bird/GameOver.js
var GameOver = class extends Actor {
  _init() {
    super._init();
    this._dom = document.createElement("div");
    this._dom.style.cssText = `
      display: flex;
      position: absolute;
      background-color: #0003;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      flex-direction : column;
      left:0;
      top: 0;
    `;
    this._dom.innerHTML = `
      <img src="assets/sprites/gameover.png"></img>
    `;
    let img = this._dom.querySelector("img");
    img.style.cssText = `
      width: 60%;
    `;
  }
  init() {
    this.w = this.scene.width;
    this.h = this.scene.height;
    this.visible = false;
    this.z = 6;
  }
};

// bird/Ground.js
var Ground = class extends Sprite {
  ox = 0;
  init() {
    this._dom = document.createElement('div');
    this._dom.className = 'ground'
    this.z = 2;
    this._dom.style.cssText = `
        position: absolute;
        width: 100%;
        
        background-image: url(/assets/sprites/base.png);
        background-size: cover;
        background-repeat: repeat;
        bottom: 0px;
      `
  }
  update() {
    if (Game.playing)
      this.ox += Game.pipeSpeed * this.scene.deltaTime;
  }
  updateDom() {
    this._dom.style.backgroundPosition = `${(-this.ox / this.scene.width * this.scene._dom.clientWidth)}px 0`;
    this._dom.style.height = `${Game.groundHeight / Game.scene.height * 100}%`;
  }
};

// bird/Pipe.js
var Pipe = class extends Sprite {
  init() {
    this.setImage("assets/sprites/pipe-green.png", Game.pixScale);
  }
  update() {
    this.x -= Game.pipeSpeed * this.scene.deltaTime;
    if (this.x <= -Game.scene.width * 0.6) {
      this.remove();
      Game.pipes = Game.pipes.filter(
        (p) => p != this
      );
    }
  }
};

// bird/ScoreBoard.js
var ScoreBoard = class extends Actor {
  #prevScore = -1;
  _init() {
    super._init();
    this._dom = document.createElement("div");
    this._dom.style.cssText = `
    position: absolute;
    left:50%;
    top: 20px;
    transform: translateX(-50%);
    background-color: yellow;
    display: flex;
    height: 3rem;
    `;
    this.z = 5;
  }
  update() {
    let score = Game.score;
    if (score != this.#prevScore) {
      this.updateScore(score);
    }
  }
  updateScore(score) {
    this.#prevScore = score;
    this._dom.innerHTML = "";
    let html = "";
    let str = "" + score;
    for (let char of str) {
      html += `<img src="assets/sprites/${char}.png" />`;
    }
    this._dom.innerHTML = html;
  }
};

// bird/Game.js
var Game = class _Game {
  static playing = false;
  static contrable = false;
  static over = false;
  static pause = false;
  static pixScale = 0.01;
  /** 管道的移动速度 */
  static pipeSpeed = 1;
  /** 管道之间水平距离 */
  static pipeHDistance = 1.5;
  /** 管道之间垂直距离 */
  static pipeVDistance = 1.5;
  /** 管道Y轴随机范围*/
  static pipeRandYRange = 1.5;
  /** 地面高度 */
  static groundHeight = 1;
  /** 背景滚动速度 */
  static bgSpeed = 0.5;
  static score = 0;
  /** @type {Background[]} */
  static _bgList = [];
  /** @type {Ground[]} */
  static _groundList = [];
  /** @type {Bird} */
  static bird;
  /** @type {Scene} */
  static scene;
  /** @type {Pipe[]} */
  static pipes = [];
  static pipeTimerHandle;
  /** @type {()=>void} */
  static updateLoop = () => {};
  static init() {
    this.bird.active = false;
    window.addEventListener("pagehide", () => _Game.pause = true);
    window.addEventListener(
      "pageshow",
      () => setTimeout(
        () => _Game.pause = false,
        500
      )
    );
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState == "hidden") {
        _Game.pause = true;
      } else {
        setTimeout(
          () => _Game.pause = false,
          500
        );
      }
    });
    let time = 0;
    requestAnimationFrame(function frame() {
      requestAnimationFrame(frame);
      if (_Game.pause) {
        this.scene.clearTime();
        return;
      }
      if (_Game.over) {
        _Game.pipeSpeed -= 0.8 * _Game.pipeSpeed * _Game.scene.deltaTime;
        _Game.bgSpeed -= 0.8 * _Game.bgSpeed * _Game.scene.deltaTime;
        _Game.pipeSpeed = Math.max(0, _Game.pipeSpeed);
        _Game.bgSpeed = Math.max(0, _Game.bgSpeed);
      }
      _Game.updateLoop();
      _Game.scene.updateDom();

      time += Game.scene.deltaTime;
    });
    this._initBg();
    this._initGround();
    this._initScoreBoard();
  }
  static _initBg() {
    new Background(this.scene);
  }
  static _initGround() {
    new Ground(this.scene);
  }
  static _initScoreBoard() {
    new ScoreBoard(this.scene);
  }
  static start() {
    this.playing = true;
    this.contrable = true;
    this.bird.active = true;
    this.pipeTimerHandle = this.makePipe();
  }
  static makePipe() {
    if (!_Game.pause) {
      let pu = new Pipe(this.scene);
      let pd = new Pipe(this.scene);
      let randY = (Math.random() - 0.5) * this.pipeRandYRange + this.groundHeight;
      pu.flipY = true;
      pu.y += 0.5 * pu.h + 0.5 * this.pipeVDistance;
      pd.y -= 0.5 * pd.h + 0.5 * this.pipeVDistance;
      pd.y += randY;
      pu.y += randY;
      pu.x = pd.x = this.scene.width * 0.6;
      this.pipes.push(pu, pd);
    }
    return setTimeout(() => {
      this.makePipe();
    }, this.pipeHDistance / this.pipeSpeed * 1e3);
  }
  static update() {

    this.scene.update();

  }
  static showGameOverUI() {
    new GameOver(this.scene).visible = true;
  }
  static gameOver() {
    if (_Game.over) return;
    this.showGameOverUI();
    this.stop();
  }
  static stop() {
    this.contrable = false;
    this.playing = true;
    this.over = true;
  }
  static canStart() {
    return !_Game.playing && !_Game.over;
  }
  /** 碰撞检测(返回和鸟碰撞的管道) */
  static collideDetect() {
    let s = M.mul([this.bird.w, this.bird.h], 0.8);
    let lt = M.sub([
      this.bird.x,
      this.bird.y
    ], M.mul(s, 0.5));
    let rd = M.sub([
      this.bird.x + s[0],
      this.bird.y + s[1]
    ], M.mul(s, 0.5));
    this.scene.debugger.drawRect(...lt, ...rd, "#00f");
    for (let pipe of this.pipes) {
      let s2 = [pipe.w, pipe.h];
      let ax = [
        pipe.x - s2[0] * 0.5,
        pipe.x + s2[0] - s2[0] * 0.5
      ];
      let ay = [
        pipe.y - s2[1] * 0.5,
        pipe.y + s2[1] - s2[1] * 0.5
      ];
      let min = [
        Math.min(...ax),
        Math.min(...ay)
      ];
      let max = [
        Math.max(...ax),
        Math.max(...ay)
      ];
      this.scene.debugger.drawRect(...min, ...max, "#f00");
      if (min[0] <= lt[0] && max[0] >= lt[0] && min[1] <= lt[1] && max[1] >= lt[1] || min[0] <= rd[0] && max[0] >= rd[0] && min[1] <= rd[1] && max[1] >= rd[1]) {
        return pipe;
      }
    }
    return void 0;
  }

  static passedActor = null;
  static canAddScore(actor) {
    if (actor == null) return false;
    if (this.passedActor == actor) return false;
    this.passedActor = actor;
    return true;
  }

  static isInGameArea() {
    return this.bird.y <= this.scene.height * 0.5 && this.bird.y - this.bird.h * 0.5 >= this.getGroundY();
  }
  static getGroundY() {
    return this.scene.height * -0.5 + this.groundHeight;
  }
};

// bird/Background.js
var Background = class extends Actor {
  ox = 0;
  init() {
    this._dom = document.createElement('div');
    this._dom.style.cssText = `
      width: 100%;
      height: 100%;
      background-image: url(/assets/sprites/background-day.png);
      background-size: cover;
      background-repeat: repeat;
    `
  }
  update() {
    if (Game.playing)
      this.ox += Game.bgSpeed * this.scene.deltaTime;
  }
  updateDom() {
    this._dom.style.backgroundPosition = `${(-this.ox / this.scene.width * this.scene._dom.clientWidth)}px 0`;
  }
};

// Quick
var BirdGame = class {
  static async loadResources() {
    await ResourceLoader.loadImages([
      "assets/sprites/bluebird-upflap.png",
      "assets/sprites/bluebird-midflap.png",
      "assets/sprites/bluebird-downflap.png",
      "assets/sprites/pipe-green.png",
      "assets/sprites/background-day.png",
      "assets/sprites/base.png"
    ])

    this.s_fly = ResourceLoader.loadSound("assets/audio/wing.ogg");
    this.s_hit = ResourceLoader.loadAudio("assets/audio/hit.ogg");
    this.s_score = ResourceLoader.loadSound("assets/audio/point.ogg", 16);
  }

  /**
   * @param name {'fly'|'hit'|'score'}
   */
  static playSound(name) {
    this['s_' + name].play();
  }

  static init() {
    Game.scene = new Scene(288 * Game.pixScale);
    Game.bird = new Bird(Game.scene);
    Game.scene.debugger.enable = false;
    Game.init();
  }

  /**
   * @param {Function} fn
   */
  static setUpdateLoop(fn) {
    Game.updateLoop = fn;
  }

  static updateLogic() {
    Game.update();
  }

  static render() {
    Game.scene.updateDom();
  }

  static frame() {
    this.updateLogic();
    this.render();
  }

  static tryStart() {
    if (Game.canStart()) {
      Game.start();
    }
  }

  static birdFlyUp() {
    Game.bird.flyUp();
  }

  static isCollidePipe() {
    return Game.collideDetect() ? true : false;
  }

  static isCollideGround() {
    return Game.bird.y - Game.bird.h * 0.5 < Game.getGroundY();
  }

  static isCollideSky() {
    return Game.bird.y > Game.scene.height * 0.5;
  }

  static over() {
    Game.gameOver();
    Game.contrable = false;
  }

  static isPassedPipe() {
    let pipe = Game.bird.rayCast(
      Game.pipes.filter(v => !v.flipY),
      Game.bird.x, Game.bird.y,
      0, -1,
      0.5, 3
    );
    if (pipe && Game.canAddScore(pipe)) {
      return true;
    }
    return false;
  }
  
  static addScore(val=1){
    Game.score += val;
  }
  
  static isGameOver(){
    return Game.over;
  }
}