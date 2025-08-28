/**
 * 魔方几何结构定义
 * 负责创建魔方的3D几何体和材质
 */
class CubeGeometry {
    constructor() {
        this.cubeSize = 0.95; // 小方块大小
        this.gap = 0.05; // 方块间距
        this.colors = {
            white: 0xffffff,   // 上面 (U)
            yellow: 0xffff00,  // 下面 (D)
            red: 0xff0000,     // 右面 (R)
            orange: 0xff8c00,  // 左面 (L)
            blue: 0x0000ff,    // 前面 (F)
            green: 0x00ff00    // 后面 (B)
        };
        
        this.materials = this.createMaterials();
        this.geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        
        // 魔方面的映射
        this.faceMap = {
            0: 'right',  // +X (R)
            1: 'left',   // -X (L)  
            2: 'top',    // +Y (U)
            3: 'bottom', // -Y (D)
            4: 'front',  // +Z (F)
            5: 'back'    // -Z (B)
        };
        
        // 颜色到面的映射
        this.colorToFace = {
            white: 'top',
            yellow: 'bottom', 
            red: 'right',
            orange: 'left',
            blue: 'front',
            green: 'back'
        };
        
        // 面到颜色的映射
        this.faceToColor = {
            top: 'white',
            bottom: 'yellow',
            right: 'red', 
            left: 'orange',
            front: 'blue',
            back: 'green'
        };
    }
    
    /**
     * 创建魔方材质
     */
    createMaterials() {
        const materials = {};
        
        Object.keys(this.colors).forEach(colorName => {
            materials[colorName] = new THREE.MeshLambertMaterial({
                color: this.colors[colorName],
                transparent: false
            });
        });
        
        // 黑色材质用于内部不可见面
        materials.black = new THREE.MeshLambertMaterial({
            color: 0x000000
        });
        
        return materials;
    }
    
    /**
     * 创建单个小方块
     * @param {number} x - X坐标 (-1, 0, 1)
     * @param {number} y - Y坐标 (-1, 0, 1) 
     * @param {number} z - Z坐标 (-1, 0, 1)
     * @param {Object} faceColors - 每个面的颜色配置
     */
    createCubie(x, y, z, faceColors) {
        const materials = [];
        
        // Three.js几何体的面顺序: right, left, top, bottom, front, back
        const faceOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];
        
        faceOrder.forEach(face => {
            if (faceColors[face]) {
                materials.push(this.materials[faceColors[face]]);
            } else {
                materials.push(this.materials.black);
            }
        });
        
        const cubie = new THREE.Mesh(this.geometry, materials);
        
        // 设置位置
        const spacing = this.cubeSize + this.gap;
        cubie.position.set(
            x * spacing,
            y * spacing, 
            z * spacing
        );
        
        // 存储初始位置和坐标
        cubie.userData = {
            initialPosition: { x, y, z },
            currentPosition: { x, y, z },
            faceColors: { ...faceColors }
        };
        
        return cubie;
    }
    
    /**
     * 获取小方块在魔方中应该显示的面颜色
     * @param {number} x - X坐标
     * @param {number} y - Y坐标  
     * @param {number} z - Z坐标
     */
    getCubieColors(x, y, z) {
        const colors = {};
        
        // 根据位置确定哪些面是可见的外表面
        if (x === 1) colors.right = this.faceToColor.right;   // 右面
        if (x === -1) colors.left = this.faceToColor.left;    // 左面
        if (y === 1) colors.top = this.faceToColor.top;       // 上面
        if (y === -1) colors.bottom = this.faceToColor.bottom; // 下面
        if (z === 1) colors.front = this.faceToColor.front;   // 前面
        if (z === -1) colors.back = this.faceToColor.back;    // 后面
        
        return colors;
    }
    
    /**
     * 创建完整的魔方
     */
    createFullCube() {
        const cubeGroup = new THREE.Group();
        
        // 创建3x3x3的小方块
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const faceColors = this.getCubieColors(x, y, z);
                    const cubie = this.createCubie(x, y, z, faceColors);
                    
                    // 添加标识符便于后续操作
                    cubie.name = `cubie_${x}_${y}_${z}`;
                    cubeGroup.add(cubie);
                }
            }
        }
        
        return cubeGroup;
    }
    
    /**
     * 获取指定层的所有小方块
     * @param {THREE.Group} cubeGroup - 魔方群组
     * @param {string} layer - 层名称 (R, L, U, D, F, B)
     */
    getLayerCubies(cubeGroup, layer) {
        const cubies = [];
        
        cubeGroup.children.forEach(cubie => {
            const pos = cubie.userData.currentPosition;
            
            switch (layer) {
                case 'R': // 右层
                    if (pos.x === 1) cubies.push(cubie);
                    break;
                case 'L': // 左层
                    if (pos.x === -1) cubies.push(cubie);
                    break;
                case 'U': // 上层
                    if (pos.y === 1) cubies.push(cubie);
                    break;
                case 'D': // 下层
                    if (pos.y === -1) cubies.push(cubie);
                    break;
                case 'F': // 前层
                    if (pos.z === 1) cubies.push(cubie);
                    break;
                case 'B': // 后层
                    if (pos.z === -1) cubies.push(cubie);
                    break;
            }
        });
        
        return cubies;
    }
    
    /**
     * 获取旋转轴和角度
     * @param {string} layer - 层名称
     * @param {boolean} clockwise - 是否顺时针
     */
    getRotationParams(layer, clockwise = true) {
        const angle = clockwise ? -Math.PI / 2 : Math.PI / 2;
        
        switch (layer) {
            case 'R':
            case 'L':
                return { axis: new THREE.Vector3(1, 0, 0), angle: layer === 'R' ? angle : -angle };
            case 'U':
            case 'D':
                return { axis: new THREE.Vector3(0, 1, 0), angle: layer === 'U' ? angle : -angle };
            case 'F':
            case 'B':
                return { axis: new THREE.Vector3(0, 0, 1), angle: layer === 'F' ? angle : -angle };
            default:
                return { axis: new THREE.Vector3(0, 1, 0), angle: 0 };
        }
    }
}

// 导出到全局
window.CubeGeometry = CubeGeometry;