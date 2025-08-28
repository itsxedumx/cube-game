/**
 * 魔方打乱序列生成器
 * 生成符合WCA标准的随机打乱序列
 */
class ScrambleGenerator {
    constructor() {
        // 基础移动
        this.baseMoves = ['R', 'L', 'U', 'D', 'F', 'B'];
        
        // 移动修饰符
        this.modifiers = ['', "'", '2'];
        
        // 相对的面（不能连续出现）
        this.oppositeFaces = {
            'R': 'L', 'L': 'R',
            'U': 'D', 'D': 'U', 
            'F': 'B', 'B': 'F'
        };
        
        // 默认打乱长度
        this.defaultLength = 20;
    }
    
    /**
     * 生成标准打乱序列
     * @param {number} length - 打乱步数，默认20
     * @param {string} difficulty - 难度等级 ('easy', 'medium', 'hard')
     */
    generateScramble(length = null, difficulty = 'medium') {
        // 根据难度调整长度
        if (!length) {
            switch (difficulty) {
                case 'easy':
                    length = 12;
                    break;
                case 'medium':
                    length = 20;
                    break;
                case 'hard':
                    length = 25;
                    break;
                default:
                    length = this.defaultLength;
            }
        }
        
        const scramble = [];
        let lastMove = null;
        let lastLastMove = null;
        
        for (let i = 0; i < length; i++) {
            let move;
            let attempts = 0;
            const maxAttempts = 100; // 防止无限循环
            
            do {
                // 随机选择面
                const face = this.baseMoves[Math.floor(Math.random() * this.baseMoves.length)];
                
                // 随机选择修饰符
                let modifier = '';
                if (difficulty === 'easy') {
                    // 简单模式只使用基础旋转和逆时针
                    modifier = Math.random() < 0.5 ? '' : "'";
                } else {
                    // 正常模式包含180度旋转
                    const modifierIndex = Math.floor(Math.random() * this.modifiers.length);
                    modifier = this.modifiers[modifierIndex];
                }
                
                move = face + modifier;
                attempts++;
                
            } while (attempts < maxAttempts && !this.isValidMove(move, lastMove, lastLastMove));
            
            if (attempts >= maxAttempts) {
                console.warn('Max attempts reached for scramble generation');
                break;
            }
            
            scramble.push(move);
            lastLastMove = lastMove;
            lastMove = this.extractFace(move);
        }
        
        return scramble;
    }
    
    /**
     * 检查移动是否有效（符合WCA规则）
     * @param {string} move - 当前移动
     * @param {string} lastMove - 上一个移动的面
     * @param {string} lastLastMove - 上上个移动的面
     */
    isValidMove(move, lastMove, lastLastMove) {
        const currentFace = this.extractFace(move);
        
        // 不能连续相同面
        if (currentFace === lastMove) {
            return false;
        }
        
        // 不能连续相对面（如 R L R）
        if (this.oppositeFaces[currentFace] === lastMove && currentFace === lastLastMove) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 从移动字符串中提取面
     * @param {string} move - 移动字符串 (如 "R'", "U2")
     */
    extractFace(move) {
        return move ? move.charAt(0) : null;
    }
    
    /**
     * 生成特定类型的打乱
     * @param {string} type - 打乱类型
     */
    generateSpecialScramble(type) {
        switch (type) {
            case 'cross-solved':
                return this.generateCrossSolvedScramble();
            case 'f2l-practice':
                return this.generateF2LPracticeScramble();
            case 'oll-practice':
                return this.generateOLLPracticeScramble();
            case 'pll-practice':
                return this.generatePLLPracticeScramble();
            default:
                return this.generateScramble();
        }
    }
    
    /**
     * 生成底面十字已完成的打乱（用于F2L练习）
     */
    generateCrossSolvedScramble() {
        // 这是一个简化实现，实际需要更复杂的算法
        // 避免破坏底面十字的移动
        const allowedMoves = ['R', 'L', 'U', 'F', 'B'];
        const scramble = [];
        
        for (let i = 0; i < 15; i++) {
            const face = allowedMoves[Math.floor(Math.random() * allowedMoves.length)];
            const modifier = Math.random() < 0.3 ? "'" : '';
            scramble.push(face + modifier);
        }
        
        return scramble;
    }
    
    /**
     * 生成F2L练习打乱
     */
    generateF2LPracticeScramble() {
        // 保持底层完成，主要打乱中层和顶层
        const scramble = [];
        const upperMoves = ['R', 'L', 'U', 'F', 'B'];
        
        for (let i = 0; i < 12; i++) {
            const face = upperMoves[Math.floor(Math.random() * upperMoves.length)];
            const modifier = Math.random() < 0.3 ? "'" : '';
            scramble.push(face + modifier);
        }
        
        return scramble;
    }
    
    /**
     * 生成OLL练习打乱
     */
    generateOLLPracticeScramble() {
        // 主要使用顶层移动
        const scramble = [];
        const moves = ['R', 'L', 'U', 'F', 'B'];
        
        for (let i = 0; i < 8; i++) {
            const face = moves[Math.floor(Math.random() * moves.length)];
            const modifier = Math.random() < 0.4 ? "'" : '';
            scramble.push(face + modifier);
        }
        
        return scramble;
    }
    
    /**
     * 生成PLL练习打乱
     */
    generatePLLPracticeScramble() {
        // 只使用顶层移动
        const scramble = [];
        const moves = ['R', 'L', 'U'];
        
        for (let i = 0; i < 6; i++) {
            const face = moves[Math.floor(Math.random() * moves.length)];
            const modifier = Math.random() < 0.3 ? "'" : '';
            scramble.push(face + modifier);
        }
        
        return scramble;
    }
    
    /**
     * 将打乱序列转换为字符串
     * @param {Array} scrambleArray - 打乱序列数组
     */
    scrambleToString(scrambleArray) {
        return scrambleArray.join(' ');
    }
    
    /**
     * 将打乱字符串转换为数组
     * @param {string} scrambleString - 打乱序列字符串
     */
    stringToScramble(scrambleString) {
        return scrambleString.trim().split(/\s+/).filter(move => move.length > 0);
    }
    
    /**
     * 验证打乱序列的有效性
     * @param {Array} scrambleArray - 打乱序列
     */
    validateScramble(scrambleArray) {
        const errors = [];
        
        for (let i = 0; i < scrambleArray.length; i++) {
            const move = scrambleArray[i];
            
            // 检查移动格式
            if (!this.isValidMoveFormat(move)) {
                errors.push(`Invalid move format: ${move}`);
                continue;
            }
            
            // 检查序列规则
            if (i > 0) {
                const lastMove = this.extractFace(scrambleArray[i - 1]);
                const lastLastMove = i > 1 ? this.extractFace(scrambleArray[i - 2]) : null;
                
                if (!this.isValidMove(move, lastMove, lastLastMove)) {
                    errors.push(`Invalid move sequence at position ${i + 1}: ${move}`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 检查单个移动的格式是否正确
     * @param {string} move - 移动字符串
     */
    isValidMoveFormat(move) {
        const regex = /^[RLUDFB]['2]?$/;
        return regex.test(move);
    }
    
    /**
     * 生成反向打乱（用于测试）
     * @param {Array} scrambleArray - 原打乱序列
     */
    generateReverseScramble(scrambleArray) {
        const reverse = [];
        
        // 反向遍历并生成反向移动
        for (let i = scrambleArray.length - 1; i >= 0; i--) {
            const move = scrambleArray[i];
            const face = this.extractFace(move);
            
            if (move.includes("'")) {
                // 逆时针变顺时针
                reverse.push(face);
            } else if (move.includes('2')) {
                // 180度保持不变
                reverse.push(face + '2');
            } else {
                // 顺时针变逆时针
                reverse.push(face + "'");
            }
        }
        
        return reverse;
    }
    
    /**
     * 获取预设打乱序列（用于测试特定情况）
     */
    getPresetScrambles() {
        return {
            'superflip': ['R', 'U', 'R', 'F', 'R', 'F', 'L', 'U', 'R', 'U', 'D', 'R', 'U', 'R', 'D', 'B', 'R', 'F', 'L', 'D'],
            'checkerboard': ['F2', 'B2', 'R2', 'L2', 'U2', 'D2'],
            'dots': ['F', 'R', 'U', "R'", 'U', "R'", 'F'],
            'simple': ['R', 'U', "R'", "U'"],
            'cross': ['F', 'R', "U'", "R'", "F'"]
        };
    }
}

// 导出到全局
window.ScrambleGenerator = ScrambleGenerator;