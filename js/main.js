/**
 * 主游戏控制器
 * 整合所有模块，管理游戏状态和用户界面
 */
class RubiksCubeGame {
    constructor() {
        // 核心模块
        this.renderer = null;
        this.cubeState = null;
        this.controller = null;
        this.timer = null;
        this.scrambleGenerator = null;
        this.solver = null;
        
        // UI元素
        this.elements = {};
        
        // 游戏状态
        this.gameState = {
            isPlaying: false,
            isScrambled: false,
            currentScramble: [],
            moveCount: 0,
            solutionState: {
                isShowing: false,
                solution: [],
                currentStep: 0,
                isExecuting: false
            }
        };
        
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        // 初始化UI元素引用
        this.initUIElements();
        
        // 创建核心模块
        this.cubeState = new CubeState();
        this.renderer = new CubeRenderer('cubeCanvas');
        this.controller = new CubeController(this.renderer, this.cubeState);
        this.timer = new GameTimer();
        this.scrambleGenerator = new ScrambleGenerator();
        this.solver = new CubeSolver();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 设置控制器回调
        this.setupControllerCallbacks();
        
        // 设置计时器回调
        this.setupTimerCallbacks();
        
        // 初始化界面
        this.updateUI();
        
        console.log('Rubik\'s Cube Game initialized successfully');
    }
    
    /**
     * 初始化UI元素引用
     */
    initUIElements() {
        this.elements = {
            // 计时器和状态
            timer: document.getElementById('timer'),
            moveCount: document.getElementById('moveCount'),
            gameStatus: document.getElementById('gameStatus'),
            
            // 控制按钮
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            scrambleBtn: document.getElementById('scrambleBtn'),
            undoBtn: document.getElementById('undoBtn'),
            solutionBtn: document.getElementById('solutionBtn'),
            newGameBtn: document.getElementById('newGameBtn'),
            
            // 统计信息
            bestTime: document.getElementById('bestTime'),
            avgTime: document.getElementById('avgTime'),
            solvedCount: document.getElementById('solvedCount'),
            tps: document.getElementById('tps'),
            
            // 操作历史
            moveHistory: document.getElementById('moveHistory'),
            
            // 完成消息
            completedMessage: document.getElementById('completedMessage'),
            finalTime: document.getElementById('finalTime'),
            finalMoves: document.getElementById('finalMoves'),
            
            // 快捷键面板
            shortcutsToggle: document.getElementById('shortcutsToggle'),
            shortcutsPanel: document.getElementById('shortcutsPanel')
        };
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 控制按钮
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
        this.elements.resetBtn.addEventListener('click', () => this.resetCube());
        this.elements.scrambleBtn.addEventListener('click', () => this.scrambleCube());
        this.elements.undoBtn.addEventListener('click', () => this.undoMove());
        this.elements.solutionBtn.addEventListener('click', () => this.showSolution());
        this.elements.newGameBtn.addEventListener('click', () => this.newGame());
        
        // 快捷键面板切换
        this.elements.shortcutsToggle.addEventListener('click', () => this.toggleShortcuts());
        
        // 点击面板外部关闭快捷键面板
        document.addEventListener('click', (e) => {
            if (!this.elements.shortcutsToggle.contains(e.target) && 
                !this.elements.shortcutsPanel.contains(e.target)) {
                this.elements.shortcutsPanel.classList.add('hidden');
            }
        });
    }
    
    /**
     * 设置控制器回调
     */
    setupControllerCallbacks() {
        this.controller.onMoveExecuted = (move) => {
            this.gameState.moveCount++;
            this.updateMoveDisplay();
            this.updateMoveHistory();
            
            // 检查是否完成
            if (this.cubeState.checkCompleted()) {
                this.handleCubeCompleted();
            }
            
            // 如果游戏未开始但魔方已打乱，自动开始计时
            if (!this.timer.isRunning && this.gameState.isScrambled && this.gameState.moveCount === 1) {
                this.timer.startTiming();
                this.gameState.isPlaying = true;
                this.updateUI();
            }
        };
        
        this.controller.onMoveUndone = (move) => {
            this.gameState.moveCount = Math.max(0, this.gameState.moveCount - 1);
            this.updateMoveDisplay();
            this.updateMoveHistory();
        };
        
        this.controller.onCubeReset = () => {
            this.handleCubeReset();
        };
        
        this.controller.onSpaceKeyPressed = () => {
            this.handleSpaceKey();
        };
    }
    
    /**
     * 设置计时器回调
     */
    setupTimerCallbacks() {
        this.timer.onTimeUpdate = (timeMs) => {
            this.elements.timer.textContent = this.timer.formatTime(timeMs);
        };
        
        this.timer.onInspectionUpdate = (timeLeft) => {
            const seconds = Math.ceil(timeLeft);
            this.elements.timer.textContent = `观察: ${seconds}s`;
            this.elements.timer.style.color = timeLeft <= 3 ? '#e74c3c' : '#f39c12';
        };
        
        this.timer.onInspectionEnd = () => {
            this.elements.timer.style.color = '#e74c3c';
            this.gameState.isPlaying = true;
            this.updateUI();
        };
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        if (this.cubeState.isCompleted) {
            // 魔方已完成，需要先打乱
            this.scrambleCube();
            return;
        }
        
        if (this.timer.isRunning) {
            return; // 已经在运行
        }
        
        // 开始观察时间
        this.timer.startInspection();
        this.gameState.isPlaying = true;
        this.updateUI();
    }
    
    /**
     * 暂停/恢复游戏
     */
    togglePause() {
        if (!this.timer.isRunning) return;
        
        if (this.timer.isPaused) {
            this.timer.resumeTiming();
        } else {
            this.timer.pauseTiming();
        }
        
        this.updateUI();
    }
    
    /**
     * 重置魔方
     */
    resetCube() {
        this.controller.resetCube();
    }
    
    /**
     * 打乱魔方
     */
    scrambleCube() {
        // 生成打乱序列
        const scramble = this.scrambleGenerator.generateScramble();
        this.gameState.currentScramble = scramble;
        
        // 重置状态
        this.timer.reset();
        this.gameState.moveCount = 0;
        this.gameState.isPlaying = false;
        this.gameState.isScrambled = true;
        
        // 隐藏完成消息
        this.elements.completedMessage.classList.add('hidden');
        
        // 执行打乱
        this.executeScrambleSequence(scramble);
        
        this.updateUI();
    }
    
    /**
     * 执行打乱序列
     */
    executeScrambleSequence(scramble) {
        // 首先重置魔方状态
        this.cubeState.reset();
        this.renderer.resetCube();
        
        // 等待一小段时间让重置完成
        setTimeout(() => {
            scramble.forEach((move, index) => {
                setTimeout(() => {
                    // 更新逻辑状态
                    this.cubeState.executeMove(move);
                    
                    // 执行动画
                    const moveData = this.cubeState.parseMove(move);
                    if (moveData) {
                        this.renderer.animateLayerRotation(
                            moveData.face, 
                            moveData.clockwise,
                            150
                        );
                    }
                }, index * 160);
            });
            
            // 清空移动历史（打乱不计入操作历史）
            setTimeout(() => {
                this.cubeState.clearHistory();
                this.updateMoveHistory();
            }, scramble.length * 160 + 200);
            
        }, 100);
    }
    
    /**
     * 撤销移动
     */
    undoMove() {
        if (this.renderer.getIsAnimating()) return;
        this.controller.undoLastMove();
    }
    
    /**
     * 显示解法
     */
    showSolution() {
        // 如果魔方已完成，没有解法可显示
        if (this.cubeState.isCompleted) {
            alert('魔方已经完成，无需求解！');
            return;
        }
        
        // 如果正在执行解法，停止执行
        if (this.gameState.solutionState.isExecuting) {
            this.stopSolutionExecution();
            return;
        }
        
        // 如果已经在显示解法，切换到执行模式
        if (this.gameState.solutionState.isShowing) {
            this.executeSolution();
            return;
        }
        
        // 生成解法
        this.generateSolution();
    }
    
    /**
     * 生成解法
     */
    generateSolution() {
        this.elements.solutionBtn.disabled = true;
        this.elements.solutionBtn.textContent = '求解中...';
        
        // 在下一个事件循环中执行求解，避免阻塞UI
        setTimeout(() => {
            try {
                const solution = this.solver.solve(this.cubeState);
                
                if (solution.length > 0) {
                    this.gameState.solutionState = {
                        isShowing: true,
                        solution: solution,
                        currentStep: 0,
                        isExecuting: false
                    };
                    
                    this.displaySolutionInfo(solution);
                    this.elements.solutionBtn.textContent = '执行解法';
                } else {
                    alert('无法找到解法，请尝试重新打乱魔方。');
                    this.elements.solutionBtn.textContent = '显示解法';
                }
            } catch (error) {
                console.error('求解过程中出现错误:', error);
                alert('求解失败，请尝试重新打乱魔方。');
                this.elements.solutionBtn.textContent = '显示解法';
            }
            
            this.elements.solutionBtn.disabled = false;
        }, 100);
    }
    
    /**
     * 显示解法信息
     */
    displaySolutionInfo(solution) {
        const solutionText = solution.join(' ');
        const stepCount = solution.length;
        
        // 更新移动历史显示解法
        const solutionHtml = `
            <div class="solution-info">
                <h4>建议解法 (${stepCount} 步):</h4>
                <div class="move-sequence solution-sequence">${solutionText}</div>
                <p class="solution-hint">点击"执行解法"自动完成</p>
            </div>
        `;
        
        this.elements.moveHistory.innerHTML = solutionHtml;
    }
    
    /**
     * 执行解法
     */
    executeSolution() {
        if (!this.gameState.solutionState.isShowing) return;
        
        this.gameState.solutionState.isExecuting = true;
        this.elements.solutionBtn.textContent = '停止执行';
        
        this.executeSolutionStep();
    }
    
    /**
     * 执行解法步骤
     */
    executeSolutionStep() {
        if (!this.gameState.solutionState.isExecuting) return;
        
        const { solution, currentStep } = this.gameState.solutionState;
        
        if (currentStep >= solution.length) {
            // 解法执行完成
            this.completeSolutionExecution();
            return;
        }
        
        // 如果正在动画中，等待动画完成
        if (this.renderer.getIsAnimating()) {
            setTimeout(() => this.executeSolutionStep(), 100);
            return;
        }
        
        // 执行当前步骤
        const move = solution[currentStep];
        this.controller.executeMove(move);
        
        // 更新步骤计数
        this.gameState.solutionState.currentStep++;
        
        // 更新显示
        this.updateSolutionProgress();
        
        // 继续执行下一步
        setTimeout(() => this.executeSolutionStep(), 300);
    }
    
    /**
     * 更新解法执行进度
     */
    updateSolutionProgress() {
        const { solution, currentStep } = this.gameState.solutionState;
        const completed = solution.slice(0, currentStep);
        const remaining = solution.slice(currentStep);
        
        const progressHtml = `
            <div class="solution-info">
                <h4>解法执行中 (${currentStep}/${solution.length}):</h4>
                <div class="solution-progress">
                    <span class="completed-moves">${completed.join(' ')}</span>
                    <span class="remaining-moves">${remaining.join(' ')}</span>
                </div>
            </div>
        `;
        
        this.elements.moveHistory.innerHTML = progressHtml;
    }
    
    /**
     * 完成解法执行
     */
    completeSolutionExecution() {
        this.gameState.solutionState = {
            isShowing: false,
            solution: [],
            currentStep: 0,
            isExecuting: false
        };
        
        this.elements.solutionBtn.textContent = '显示解法';
        this.updateMoveHistory();
        
        // 如果魔方完成了，触发完成逻辑
        if (this.cubeState.checkCompleted()) {
            this.handleCubeCompleted();
        }
    }
    
    /**
     * 停止解法执行
     */
    stopSolutionExecution() {
        this.gameState.solutionState.isExecuting = false;
        this.elements.solutionBtn.textContent = '执行解法';
        this.updateMoveHistory();
    }
    
    /**
     * 新游戏
     */
    newGame() {
        this.elements.completedMessage.classList.add('hidden');
        this.scrambleCube();
    }
    
    /**
     * 处理空格键
     */
    handleSpaceKey() {
        if (this.timer.isInspecting) {
            // 观察期间按空格开始计时
            this.timer.startTiming();
            this.gameState.isPlaying = true;
            this.updateUI();
        } else if (this.timer.isRunning) {
            // 计时期间按空格暂停/恢复
            this.togglePause();
        } else if (this.cubeState.isCompleted) {
            // 完成状态下按空格开始新游戏
            this.scrambleCube();
        } else {
            // 其他情况开始游戏
            this.startGame();
        }
    }
    
    /**
     * 处理魔方完成
     */
    handleCubeCompleted() {
        if (!this.gameState.isScrambled) return; // 只在打乱后完成才计时
        
        const finalTime = this.timer.stopTiming();
        this.gameState.isPlaying = false;
        this.gameState.isScrambled = false;
        
        // 显示完成消息
        this.elements.finalTime.textContent = this.timer.formatTime(finalTime);
        this.elements.finalMoves.textContent = this.gameState.moveCount;
        this.elements.completedMessage.classList.remove('hidden');
        
        // 更新统计信息
        this.updateStatistics();
        
        this.updateUI();
        
        console.log(`Cube completed! Time: ${this.timer.formatTime(finalTime)}, Moves: ${this.gameState.moveCount}`);
    }
    
    /**
     * 处理魔方重置
     */
    handleCubeReset() {
        this.timer.reset();
        this.gameState.moveCount = 0;
        this.gameState.isPlaying = false;
        this.gameState.isScrambled = false;
        this.gameState.currentScramble = [];
        
        this.elements.completedMessage.classList.add('hidden');
        this.updateUI();
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        // 更新游戏状态显示
        if (this.cubeState.isCompleted && !this.gameState.isScrambled) {
            this.elements.gameStatus.textContent = '已完成';
            this.elements.gameStatus.style.color = '#27ae60';
        } else if (this.timer.isInspecting) {
            this.elements.gameStatus.textContent = '观察中';
            this.elements.gameStatus.style.color = '#f39c12';
        } else if (this.timer.isRunning) {
            this.elements.gameStatus.textContent = this.timer.isPaused ? '已暂停' : '进行中';
            this.elements.gameStatus.style.color = this.timer.isPaused ? '#e67e22' : '#3498db';
        } else {
            this.elements.gameStatus.textContent = this.gameState.isScrambled ? '准备开始' : '等待打乱';
            this.elements.gameStatus.style.color = '#7f8c8d';
        }
        
        // 更新按钮状态
        this.elements.startBtn.disabled = this.timer.isRunning || this.cubeState.isCompleted;
        this.elements.pauseBtn.disabled = !this.timer.isRunning;
        this.elements.pauseBtn.textContent = this.timer.isPaused ? '继续' : '暂停';
        this.elements.undoBtn.disabled = this.timer.isRunning || this.cubeState.getMoveHistory().length === 0 || this.gameState.solutionState.isExecuting;
        this.elements.solutionBtn.disabled = this.timer.isRunning || this.cubeState.isCompleted;
        
        // 更新移动计数和历史
        this.updateMoveDisplay();
        this.updateMoveHistory();
        this.updateStatistics();
    }
    
    /**
     * 更新移动显示
     */
    updateMoveDisplay() {
        this.elements.moveCount.textContent = this.gameState.moveCount;
    }
    
    /**
     * 更新移动历史显示
     */
    updateMoveHistory() {
        const history = this.cubeState.getMoveHistory();
        
        if (history.length === 0) {
            this.elements.moveHistory.innerHTML = '<p class="no-moves">暂无操作</p>';
        } else {
            const historyText = history.join(' ');
            this.elements.moveHistory.innerHTML = `<div class="move-sequence">${historyText}</div>`;
        }
    }
    
    /**
     * 更新统计信息
     */
    updateStatistics() {
        // 最佳时间
        const bestTime = this.timer.getBestTime();
        this.elements.bestTime.textContent = bestTime ? this.timer.formatTime(bestTime, false) : '--:--';
        
        // 平均时间
        const avgTime = this.timer.getAverageTime();
        this.elements.avgTime.textContent = avgTime ? this.timer.formatTime(avgTime, false) : '--:--';
        
        // 完成次数
        this.elements.solvedCount.textContent = this.timer.getSolvedCount();
        
        // TPS (每秒转动数)
        if (this.timer.isRunning || this.timer.getCurrentTime() > 0) {
            const currentTime = this.timer.getCurrentTime();
            if (currentTime > 0) {
                const tps = this.timer.getTPS(this.gameState.moveCount, currentTime);
                this.elements.tps.textContent = tps;
            }
        } else {
            this.elements.tps.textContent = '0.0';
        }
    }
    
    /**
     * 切换快捷键面板
     */
    toggleShortcuts() {
        this.elements.shortcutsPanel.classList.toggle('hidden');
    }
    
    /**
     * 获取游戏状态
     */
    getGameState() {
        return {
            ...this.gameState,
            timerState: this.timer.getStatus(),
            cubeCompleted: this.cubeState.isCompleted,
            moveHistory: this.cubeState.getMoveHistory()
        };
    }
}

// 导出到全局
window.RubiksCubeGame = RubiksCubeGame;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new RubiksCubeGame();
});