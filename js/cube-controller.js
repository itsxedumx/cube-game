/**
 * 魔方控制器
 * 负责处理用户交互和魔方操作逻辑
 */
class CubeController {
    constructor(renderer, cubeState) {
        this.renderer = renderer;
        this.cubeState = cubeState;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.isDragging = false;
        this.startMousePosition = { x: 0, y: 0 };
        this.selectedFace = null;
        
        // 面检测阈值
        this.clickThreshold = 5; // 像素
        
        this.setupEventListeners();
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const canvas = this.renderer.canvas;
        
        // 鼠标事件 - 用于面旋转
        canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onCanvasMouseUp(e));
        
        // 键盘事件 - 快捷键
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // 触摸事件
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    /**
     * 鼠标按下事件（面旋转检测）
     */
    onCanvasMouseDown(event) {
        // 如果右键，忽略（用于视角控制）
        if (event.button === 2) return;
        
        // 如果正在动画，忽略
        if (this.renderer.getIsAnimating()) return;
        
        this.isDragging = false;
        this.startMousePosition.x = event.clientX;
        this.startMousePosition.y = event.clientY;
        
        // 进行射线检测
        this.updateMousePosition(event);
        this.selectedFace = this.detectClickedFace();
    }
    
    /**
     * 鼠标移动事件
     */
    onCanvasMouseMove(event) {
        if (!this.selectedFace) return;
        
        const deltaX = Math.abs(event.clientX - this.startMousePosition.x);
        const deltaY = Math.abs(event.clientY - this.startMousePosition.y);
        
        if (deltaX > this.clickThreshold || deltaY > this.clickThreshold) {
            this.isDragging = true;
        }
    }
    
    /**
     * 鼠标抬起事件
     */
    onCanvasMouseUp(event) {
        // 如果右键或正在动画，忽略
        if (event.button === 2 || this.renderer.getIsAnimating()) return;
        
        if (this.selectedFace && !this.isDragging) {
            // 这是一个点击而不是拖拽，执行面旋转
            const deltaX = event.clientX - this.startMousePosition.x;
            const deltaY = event.clientY - this.startMousePosition.y;
            
            this.executeFaceRotation(this.selectedFace, deltaX, deltaY);
        }
        
        this.selectedFace = null;
        this.isDragging = false;
    }
    
    /**
     * 键盘按键事件
     */
    onKeyDown(event) {
        // 如果正在动画，忽略
        if (this.renderer.getIsAnimating()) return;
        
        const key = event.key.toLowerCase();
        let move = null;
        
        // 映射键盘按键到魔方记号法
        switch (key) {
            case 'r': move = event.shiftKey ? "R'" : 'R'; break;
            case 'l': move = event.shiftKey ? "L'" : 'L'; break;
            case 'u': move = event.shiftKey ? "U'" : 'U'; break;
            case 'd': move = event.shiftKey ? "D'" : 'D'; break;
            case 'f': move = event.shiftKey ? "F'" : 'F'; break;
            case 'b': move = event.shiftKey ? "B'" : 'B'; break;
            case ' ': // 空格键 - 暂停/开始
                event.preventDefault();
                this.handleSpaceKey();
                return;
            case 'z': // Ctrl+Z - 撤销
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.undoLastMove();
                }
                return;
            default:
                return;
        }
        
        if (move) {
            event.preventDefault();
            this.executeMove(move);
        }
    }
    
    /**
     * 触摸开始事件
     */
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.startMousePosition.x = touch.clientX;
            this.startMousePosition.y = touch.clientY;
            
            this.updateMousePositionFromTouch(touch);
            this.selectedFace = this.detectClickedFace();
        }
    }
    
    /**
     * 触摸移动事件
     */
    onTouchMove(event) {
        // 阻止页面滚动
        event.preventDefault();
        
        if (!this.selectedFace || event.touches.length !== 1) return;
        
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - this.startMousePosition.x);
        const deltaY = Math.abs(touch.clientY - this.startMousePosition.y);
        
        if (deltaX > this.clickThreshold || deltaY > this.clickThreshold) {
            this.isDragging = true;
        }
    }
    
    /**
     * 触摸结束事件
     */
    onTouchEnd(event) {
        if (this.selectedFace && !this.isDragging && event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - this.startMousePosition.x;
            const deltaY = touch.clientY - this.startMousePosition.y;
            
            this.executeFaceRotation(this.selectedFace, deltaX, deltaY);
        }
        
        this.selectedFace = null;
        this.isDragging = false;
    }
    
    /**
     * 更新鼠标位置（归一化）
     */
    updateMousePosition(event) {
        const rect = this.renderer.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * 从触摸事件更新鼠标位置
     */
    updateMousePositionFromTouch(touch) {
        const rect = this.renderer.canvas.getBoundingClientRect();
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * 检测点击的魔方面
     */
    detectClickedFace() {
        this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
        const intersects = this.raycaster.intersectObjects(this.renderer.cubeGroup.children, true);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const cubie = intersection.object;
            const faceIndex = intersection.face.materialIndex;
            
            // 获取被点击的面和对应的层
            const face = this.getFaceFromIntersection(cubie, faceIndex);
            return face;
        }
        
        return null;
    }
    
    /**
     * 从射线交点获取魔方面信息
     */
    getFaceFromIntersection(cubie, faceIndex) {
        const pos = cubie.userData.currentPosition;
        
        // Three.js几何体面的顺序: right, left, top, bottom, front, back (0-5)
        const faceMap = {
            0: 'right',   // +X
            1: 'left',    // -X
            2: 'top',     // +Y
            3: 'bottom',  // -Y
            4: 'front',   // +Z
            5: 'back'     // -Z
        };
        
        const localFace = faceMap[faceIndex];
        
        // 确定这个面是否是外表面，以及对应的层
        let layer = null;
        
        switch (localFace) {
            case 'right':
                if (pos.x === 1) layer = 'R';
                break;
            case 'left':
                if (pos.x === -1) layer = 'L';
                break;
            case 'top':
                if (pos.y === 1) layer = 'U';
                break;
            case 'bottom':
                if (pos.y === -1) layer = 'D';
                break;
            case 'front':
                if (pos.z === 1) layer = 'F';
                break;
            case 'back':
                if (pos.z === -1) layer = 'B';
                break;
        }
        
        if (layer) {
            return {
                layer: layer,
                cubie: cubie,
                localFace: localFace
            };
        }
        
        return null;
    }
    
    /**
     * 执行面旋转
     */
    executeFaceRotation(faceInfo, deltaX, deltaY) {
        if (!faceInfo) return;
        
        const { layer } = faceInfo;
        
        // 根据拖拽方向决定旋转方向
        // 这里使用简单的点击旋转逻辑：左键顺时针，Shift+左键逆时针
        const clockwise = true; // 默认顺时针
        
        this.executeMove(clockwise ? layer : layer + "'");
    }
    
    /**
     * 执行魔方移动
     */
    executeMove(move) {
        // 更新逻辑状态
        if (this.cubeState.executeMove(move)) {
            // 解析移动以获取动画参数
            const moveData = this.cubeState.parseMove(move);
            if (moveData) {
                // 执行3D动画
                this.renderer.animateLayerRotation(
                    moveData.face, 
                    moveData.clockwise,
                    moveData.double ? 400 : 200
                );
                
                // 触发移动事件
                this.onMoveExecuted(move);
            }
        }
    }
    
    /**
     * 撤销上一步移动
     */
    undoLastMove() {
        const history = this.cubeState.getMoveHistory();
        if (history.length === 0) return;
        
        if (this.cubeState.undoLastMove()) {
            const lastMove = history[history.length - 1];
            const reverseMove = this.cubeState.getReverseMove(lastMove);
            const moveData = this.cubeState.parseMove(reverseMove);
            
            if (moveData) {
                this.renderer.animateLayerRotation(
                    moveData.face, 
                    moveData.clockwise,
                    moveData.double ? 400 : 200
                );
                
                // 触发撤销事件
                this.onMoveUndone(lastMove);
            }
        }
    }
    
    /**
     * 重置魔方
     */
    resetCube() {
        this.cubeState.reset();
        this.renderer.resetCube();
        this.onCubeReset();
    }
    
    /**
     * 处理空格键
     */
    handleSpaceKey() {
        // 由主游戏控制器处理计时器逻辑
        this.onSpaceKeyPressed();
    }
    
    /**
     * 获取当前状态
     */
    isCompleted() {
        return this.cubeState.isCompleted;
    }
    
    /**
     * 获取移动历史
     */
    getMoveHistory() {
        return this.cubeState.getMoveHistory();
    }
    
    /**
     * 获取移动数量
     */
    getMoveCount() {
        return this.cubeState.getMoveHistory().length;
    }
    
    // 事件回调函数（由主控制器重写）
    onMoveExecuted(move) {
        console.log('Move executed:', move);
    }
    
    onMoveUndone(move) {
        console.log('Move undone:', move);
    }
    
    onCubeReset() {
        console.log('Cube reset');
    }
    
    onSpaceKeyPressed() {
        console.log('Space key pressed');
    }
    
    onCubeCompleted() {
        console.log('Cube completed!');
    }
}

// 导出到全局
window.CubeController = CubeController;