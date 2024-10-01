// 加载所有资源
await BirdGame.loadResources();
// 初始化游戏
BirdGame.init();

// 游戏循环
BirdGame.setUpdateLoop(() => {
  // 更新游戏
  BirdGame.frame();
});

// 点击事件
window.onclick = () => {
  BirdGame.tryStart();
  // 点击时，如果游戏没有结束，小鸟向上飞，并且播放声音
  if (!BirdGame.isGameOver()) {
    BirdGame.birdFlyUp();
    BirdGame.playSound('fly');
  }
}

// 设置一个定时循环任务,间隔(1000/10)ms
setInterval(() => {
  // 如果鸟和
  // 地面，管道，天空
  // 碰撞则结束游戏
  if (BirdGame.isCollideGround() ||
    BirdGame.isCollidePipe() ||
    BirdGame.isCollideSky()) {
    if (!BirdGame.isGameOver()) {
      BirdGame.playSound('hit');
    }
    BirdGame.over();
  }
  // 如果鸟飞过管道则加分
  if (BirdGame.isPassedPipe()) {
    BirdGame.addScore();
    BirdGame.playSound('score');
  }
}, 1000 / 10)