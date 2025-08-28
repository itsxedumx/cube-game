/**
 * 游戏计时器
 * 负责游戏时间统计和计时逻辑
 */
class GameTimer {
    constructor() {
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPausedTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        
        // 观察时间（WCA标准15秒）
        this.inspectionTime = 15;
        this.isInspecting = false;
        this.inspectionStartTime = 0;
        
        // 回调函数
        this.onTimeUpdate = null;
        this.onInspectionUpdate = null;
        this.onInspectionEnd = null;
        
        // 定时器
        this.updateInterval = null;
        
        // 统计数据
        this.sessionTimes = this.loadSessionTimes();
        this.bestTime = this.getBestTime();
    }
    
    /**
     * 开始观察时间
     */
    startInspection() {
        this.isInspecting = true;
        this.inspectionStartTime = Date.now();
        this.startUpdateLoop();
        
        if (this.onInspectionUpdate) {
            this.onInspectionUpdate(this.inspectionTime);
        }
    }
    
    /**
     * 结束观察时间，开始计时
     */
    startTiming() {
        if (this.isInspecting) {
            this.isInspecting = false;
            if (this.onInspectionEnd) {
                this.onInspectionEnd();
            }
        }
        
        this.startTime = Date.now();
        this.totalPausedTime = 0;
        this.isRunning = true;
        this.isPaused = false;
        
        this.startUpdateLoop();
    }
    
    /**
     * 停止计时
     */
    stopTiming() {
        if (!this.isRunning) return 0;
        
        const finalTime = this.getCurrentTime();
        this.isRunning = false;
        this.isPaused = false;
        this.stopUpdateLoop();
        
        // 保存成绩
        this.addTime(finalTime);
        
        return finalTime;
    }
    
    /**
     * 暂停计时
     */
    pauseTiming() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        this.pauseTime = Date.now();
    }
    
    /**
     * 恢复计时
     */
    resumeTiming() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.totalPausedTime += Date.now() - this.pauseTime;
        this.isPaused = false;
        this.pauseTime = 0;
    }
    
    /**
     * 重置计时器
     */
    reset() {
        this.startTime = 0;
        this.pauseTime = 0;
        this.totalPausedTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isInspecting = false;
        this.inspectionStartTime = 0;
        
        this.stopUpdateLoop();
        
        if (this.onTimeUpdate) {
            this.onTimeUpdate(0);
        }
    }
    
    /**
     * 获取当前时间（毫秒）
     */
    getCurrentTime() {
        if (!this.isRunning) return 0;
        
        let currentTime = Date.now() - this.startTime - this.totalPausedTime;
        
        if (this.isPaused) {
            currentTime -= (Date.now() - this.pauseTime);
        }
        
        return Math.max(0, currentTime);
    }
    
    /**
     * 获取观察剩余时间
     */
    getInspectionTimeLeft() {
        if (!this.isInspecting) return 0;
        
        const elapsed = (Date.now() - this.inspectionStartTime) / 1000;
        return Math.max(0, this.inspectionTime - elapsed);
    }
    
    /**
     * 格式化时间显示
     * @param {number} timeMs - 时间（毫秒）
     * @param {boolean} showMs - 是否显示毫秒
     */
    formatTime(timeMs, showMs = true) {
        if (!timeMs || timeMs < 0) return showMs ? '00:00.00' : '00:00';
        
        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((timeMs % 1000) / 10);
        
        const formatNumber = (num, digits) => num.toString().padStart(digits, '0');
        
        if (minutes > 0) {
            return showMs 
                ? `${formatNumber(minutes, 2)}:${formatNumber(seconds, 2)}.${formatNumber(milliseconds, 2)}`
                : `${formatNumber(minutes, 2)}:${formatNumber(seconds, 2)}`;
        } else {
            return showMs 
                ? `${formatNumber(seconds, 2)}.${formatNumber(milliseconds, 2)}`
                : `${formatNumber(seconds, 2)}`;
        }
    }
    
    /**
     * 开始更新循环
     */
    startUpdateLoop() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            if (this.isInspecting) {
                const timeLeft = this.getInspectionTimeLeft();
                if (this.onInspectionUpdate) {
                    this.onInspectionUpdate(timeLeft);
                }
                
                // 观察时间结束
                if (timeLeft <= 0) {
                    this.startTiming();
                }
            } else if (this.isRunning && !this.isPaused) {
                if (this.onTimeUpdate) {
                    this.onTimeUpdate(this.getCurrentTime());
                }
            }
        }, 10); // 每10毫秒更新一次
    }
    
    /**
     * 停止更新循环
     */
    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * 添加完成时间到记录
     */
    addTime(timeMs) {
        this.sessionTimes.push(timeMs);
        
        // 保存到本地存储
        this.saveSessionTimes();
        
        // 更新最佳时间
        if (!this.bestTime || timeMs < this.bestTime) {
            this.bestTime = timeMs;
        }
    }
    
    /**
     * 获取最佳时间
     */
    getBestTime() {
        return this.sessionTimes.length > 0 ? Math.min(...this.sessionTimes) : null;
    }
    
    /**
     * 获取平均时间
     */
    getAverageTime() {
        if (this.sessionTimes.length === 0) return null;
        
        const sum = this.sessionTimes.reduce((a, b) => a + b, 0);
        return sum / this.sessionTimes.length;
    }
    
    /**
     * 获取Ao5（最近5次的平均时间，去掉最好和最差）
     */
    getAo5() {
        if (this.sessionTimes.length < 5) return null;
        
        const last5 = this.sessionTimes.slice(-5);
        const sorted = [...last5].sort((a, b) => a - b);
        
        // 去掉最好和最差，取中间三个的平均
        const middle3 = sorted.slice(1, 4);
        return middle3.reduce((a, b) => a + b, 0) / 3;
    }
    
    /**
     * 获取Ao12（最近12次的平均时间，去掉最好和最差）
     */
    getAo12() {
        if (this.sessionTimes.length < 12) return null;
        
        const last12 = this.sessionTimes.slice(-12);
        const sorted = [...last12].sort((a, b) => a - b);
        
        // 去掉最好和最差，取中间10个的平均
        const middle10 = sorted.slice(1, 11);
        return middle10.reduce((a, b) => a + b, 0) / 10;
    }
    
    /**
     * 获取完成次数
     */
    getSolvedCount() {
        return this.sessionTimes.length;
    }
    
    /**
     * 获取TPS（每秒转动数）
     * @param {number} moveCount - 移动步数
     * @param {number} timeMs - 完成时间（毫秒）
     */
    getTPS(moveCount, timeMs) {
        if (!timeMs || timeMs <= 0) return 0;
        return (moveCount / (timeMs / 1000)).toFixed(1);
    }
    
    /**
     * 清空会话记录
     */
    clearSession() {
        this.sessionTimes = [];
        this.bestTime = null;
        this.saveSessionTimes();
    }
    
    /**
     * 从本地存储加载时间记录
     */
    loadSessionTimes() {
        try {
            const saved = localStorage.getItem('cubeTimerSessionTimes');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load session times:', e);
            return [];
        }
    }
    
    /**
     * 保存时间记录到本地存储
     */
    saveSessionTimes() {
        try {
            localStorage.setItem('cubeTimerSessionTimes', JSON.stringify(this.sessionTimes));
        } catch (e) {
            console.warn('Failed to save session times:', e);
        }
    }
    
    /**
     * 获取状态信息
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            isInspecting: this.isInspecting,
            currentTime: this.getCurrentTime(),
            inspectionTimeLeft: this.getInspectionTimeLeft()
        };
    }
}

// 导出到全局
window.GameTimer = GameTimer;