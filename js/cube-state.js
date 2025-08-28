/**
 * 魔方状态管理器
 * 负责跟踪魔方的当前状态和执行旋转操作
 */
class CubeState {
    constructor() {
        this.reset();
    }
    
    /**
     * 重置魔方到已完成状态
     */
    reset() {
        // 使用标准魔方配色：白上黄下，红右橙左，蓝前绿后
        this.state = {
            U: Array(9).fill('white'),   // 上面
            D: Array(9).fill('yellow'),  // 下面
            R: Array(9).fill('red'),     // 右面
            L: Array(9).fill('orange'),  // 左面
            F: Array(9).fill('blue'),    // 前面
            B: Array(9).fill('green')    // 后面
        };
        
        this.moveHistory = [];
        this.isCompleted = true;
    }
    
    /**
     * 检查魔方是否已完成
     */
    checkCompleted() {
        for (const face of Object.keys(this.state)) {
            const colors = this.state[face];
            const firstColor = colors[0];
            
            // 检查每个面是否所有方块都是同一颜色
            if (!colors.every(color => color === firstColor)) {
                this.isCompleted = false;
                return false;
            }
        }
        
        this.isCompleted = true;
        return true;
    }
    
    /**
     * 执行旋转操作
     * @param {string} move - 旋转记号 (R, R', U, U2, etc.)
     */
    executeMove(move) {
        const moveData = this.parseMove(move);
        if (!moveData) return false;
        
        const { face, clockwise, double } = moveData;
        
        if (double) {
            // 执行两次90度旋转
            this.rotateFace(face, clockwise);
            this.rotateFace(face, clockwise);
        } else {
            this.rotateFace(face, clockwise);
        }
        
        this.moveHistory.push(move);
        this.checkCompleted();
        return true;
    }
    
    /**
     * 解析旋转记号
     * @param {string} move - 旋转记号
     */
    parseMove(move) {
        const cleanMove = move.trim().toUpperCase();
        
        // 匹配模式：面 + 可选的修饰符(' 或 2)
        const match = cleanMove.match(/^([RLUDFB])(['2]?)$/);
        if (!match) return null;
        
        const face = match[1];
        const modifier = match[2];
        
        return {
            face,
            clockwise: modifier !== "'",
            double: modifier === '2'
        };
    }
    
    /**
     * 旋转指定面
     * @param {string} face - 面名称 (R, L, U, D, F, B)
     * @param {boolean} clockwise - 是否顺时针
     */
    rotateFace(face, clockwise = true) {
        // 旋转面本身
        this.rotateFaceArray(this.state[face], clockwise);
        
        // 旋转相邻的边
        this.rotateAdjacentEdges(face, clockwise);
    }
    
    /**
     * 旋转面数组（9个方块的排列）
     * @param {Array} faceArray - 面数组
     * @param {boolean} clockwise - 是否顺时针
     */
    rotateFaceArray(faceArray, clockwise) {
        const temp = [...faceArray];
        
        if (clockwise) {
            // 顺时针旋转90度的索引映射
            faceArray[0] = temp[6]; faceArray[1] = temp[3]; faceArray[2] = temp[0];
            faceArray[3] = temp[7]; faceArray[4] = temp[4]; faceArray[5] = temp[1];
            faceArray[6] = temp[8]; faceArray[7] = temp[5]; faceArray[8] = temp[2];
        } else {
            // 逆时针旋转90度的索引映射
            faceArray[0] = temp[2]; faceArray[1] = temp[5]; faceArray[2] = temp[8];
            faceArray[3] = temp[1]; faceArray[4] = temp[4]; faceArray[5] = temp[7];
            faceArray[6] = temp[0]; faceArray[7] = temp[3]; faceArray[8] = temp[6];
        }
    }
    
    /**
     * 旋转相邻边的颜色
     * @param {string} face - 面名称
     * @param {boolean} clockwise - 是否顺时针
     */
    rotateAdjacentEdges(face, clockwise) {
        const rotations = {
            'R': {
                clockwise: [
                    [['U', [2, 5, 8]], ['F', [2, 5, 8]], ['D', [2, 5, 8]], ['B', [6, 3, 0]]]
                ],
                counterClockwise: [
                    [['U', [2, 5, 8]], ['B', [6, 3, 0]], ['D', [2, 5, 8]], ['F', [2, 5, 8]]]
                ]
            },
            'L': {
                clockwise: [
                    [['U', [0, 3, 6]], ['B', [8, 5, 2]], ['D', [0, 3, 6]], ['F', [0, 3, 6]]]
                ],
                counterClockwise: [
                    [['U', [0, 3, 6]], ['F', [0, 3, 6]], ['D', [0, 3, 6]], ['B', [8, 5, 2]]]
                ]
            },
            'U': {
                clockwise: [
                    [['B', [0, 1, 2]], ['R', [0, 1, 2]], ['F', [0, 1, 2]], ['L', [0, 1, 2]]]
                ],
                counterClockwise: [
                    [['B', [0, 1, 2]], ['L', [0, 1, 2]], ['F', [0, 1, 2]], ['R', [0, 1, 2]]]
                ]
            },
            'D': {
                clockwise: [
                    [['F', [6, 7, 8]], ['R', [6, 7, 8]], ['B', [6, 7, 8]], ['L', [6, 7, 8]]]
                ],
                counterClockwise: [
                    [['F', [6, 7, 8]], ['L', [6, 7, 8]], ['B', [6, 7, 8]], ['R', [6, 7, 8]]]
                ]
            },
            'F': {
                clockwise: [
                    [['U', [6, 7, 8]], ['R', [0, 3, 6]], ['D', [2, 1, 0]], ['L', [8, 5, 2]]]
                ],
                counterClockwise: [
                    [['U', [6, 7, 8]], ['L', [8, 5, 2]], ['D', [2, 1, 0]], ['R', [0, 3, 6]]]
                ]
            },
            'B': {
                clockwise: [
                    [['U', [2, 1, 0]], ['L', [0, 3, 6]], ['D', [6, 7, 8]], ['R', [8, 5, 2]]]
                ],
                counterClockwise: [
                    [['U', [2, 1, 0]], ['R', [8, 5, 2]], ['D', [6, 7, 8]], ['L', [0, 3, 6]]]
                ]
            }
        };
        
        const rotation = rotations[face];
        if (!rotation) return;
        
        const cycle = clockwise ? rotation.clockwise[0] : rotation.counterClockwise[0];
        
        // 保存第一组颜色
        const temp = [];
        const [firstFace, firstIndices] = cycle[0];
        firstIndices.forEach(idx => {
            temp.push(this.state[firstFace][idx]);
        });
        
        // 循环移动颜色
        for (let i = 0; i < cycle.length - 1; i++) {
            const [fromFace, fromIndices] = cycle[i + 1];
            const [toFace, toIndices] = cycle[i];
            
            for (let j = 0; j < fromIndices.length; j++) {
                this.state[toFace][toIndices[j]] = this.state[fromFace][fromIndices[j]];
            }
        }
        
        // 将保存的颜色放到最后一组位置
        const [lastFace, lastIndices] = cycle[cycle.length - 1];
        for (let i = 0; i < lastIndices.length; i++) {
            this.state[lastFace][lastIndices[i]] = temp[i];
        }
    }
    
    /**
     * 撤销上一步操作
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) return false;
        
        const lastMove = this.moveHistory.pop();
        const reverseMove = this.getReverseMove(lastMove);
        
        // 临时移除历史记录以避免无限循环
        const tempHistory = [...this.moveHistory];
        this.moveHistory = [];
        
        this.executeMove(reverseMove);
        
        // 恢复历史记录
        this.moveHistory = tempHistory;
        
        this.checkCompleted();
        return true;
    }
    
    /**
     * 获取反向操作
     * @param {string} move - 原操作
     */
    getReverseMove(move) {
        const moveData = this.parseMove(move);
        if (!moveData) return '';
        
        const { face, clockwise, double } = moveData;
        
        if (double) {
            // 180度旋转的反操作还是180度旋转
            return face + '2';
        } else if (clockwise) {
            // 顺时针的反操作是逆时针
            return face + "'";
        } else {
            // 逆时针的反操作是顺时针
            return face;
        }
    }
    
    /**
     * 获取当前状态的副本
     */
    getStateCopy() {
        const copy = {};
        Object.keys(this.state).forEach(face => {
            copy[face] = [...this.state[face]];
        });
        return copy;
    }
    
    /**
     * 设置魔方状态
     * @param {Object} newState - 新状态
     */
    setState(newState) {
        this.state = {};
        Object.keys(newState).forEach(face => {
            this.state[face] = [...newState[face]];
        });
        this.checkCompleted();
    }
    
    /**
     * 获取操作历史
     */
    getMoveHistory() {
        return [...this.moveHistory];
    }
    
    /**
     * 清空操作历史
     */
    clearHistory() {
        this.moveHistory = [];
    }
}

// 导出到全局
window.CubeState = CubeState;