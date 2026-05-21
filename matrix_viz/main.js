class MatrixApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.matrices = new Map();
        this.matrices.set('A', [[1, 0], [0, 1]]);
        this.matrices.set('B', [[1, 0], [0, 1]]);

        this.selectedMatrix = 'A';
        this.mode = '2d';
        this.t = 0.5;
        this.scale = 1.0;
        this.showBasis = false;
        this.showGrid = true;
        this.showOriginalGrid = false;
        this.darkMode = true;

        this.cameraRot = { x: 0.4, y: 0.7 };
        this.cameraRotDefault = { x: 0.4, y: 0.7 };

        this.setupEventListeners();
        this.renderMatrixUI();
        this.render();
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    setupEventListeners() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const newMode = e.target.dataset.mode;
                this.switchMode(newMode);
            });
        });

        document.getElementById('t-slider').addEventListener('input', (e) => {
            this.t = parseFloat(e.target.value);
            document.getElementById('t-value').textContent = this.t.toFixed(2);
            this.render();
        });

        document.getElementById('scale-slider').addEventListener('input', (e) => {
            this.scale = parseFloat(e.target.value);
            document.getElementById('scale-value').textContent = this.scale.toFixed(2);
            this.render();
        });

        document.getElementById('show-basis').addEventListener('change', (e) => {
            this.showBasis = e.target.checked;
            this.render();
        });

        document.getElementById('show-grid').addEventListener('change', (e) => {
            this.showOriginalGrid = e.target.checked;
            this.render();
        });

        document.querySelector('.reset-btn').addEventListener('click', () => this.resetCamera());

        document.getElementById('light-mode-btn').addEventListener('click', () => this.toggleDarkMode());

        const modal = document.getElementById('operations-modal');
        const btn = document.getElementById('operations-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
            });
        }

        let isDragging = false;
        let prevX = 0, prevY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            prevX = e.clientX;
            prevY = e.clientY;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && this.mode === '3d') {
                const dx = (e.clientX - prevX) * 0.01;
                const dy = (e.clientY - prevY) * 0.01;
                this.cameraRot.y += dx;
                this.cameraRot.x += dy;
                prevX = e.clientX;
                prevY = e.clientY;
                this.render();
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.style.filter = this.darkMode ? 'none' : 'invert(1) hue-rotate(180deg)';
        
        const btn = document.getElementById('light-mode-btn');
        btn.style.backgroundColor = this.darkMode ? '#ffffff' : '#1a1f28';
        btn.style.color = this.darkMode ? '#1a1f28' : '#ffffff';
    }

    switchMode(newMode) {
        this.mode = newMode;
        
        for (const [name, matrix] of this.matrices) {
            if (newMode === '2d' && matrix.length === 3) {
                this.matrices.set(name, [
                    [matrix[0][0], matrix[0][1]],
                    [matrix[1][0], matrix[1][1]]
                ]);
            } else if (newMode === '3d' && matrix.length === 2) {
                this.matrices.set(name, [
                    [matrix[0][0], matrix[0][1], 0],
                    [matrix[1][0], matrix[1][1], 0],
                    [0, 0, 1]
                ]);
            }
        }
        
        this.renderMatrixUI();
        this.render();
    }

    renderMatrixUI() {
        const container = document.getElementById('matrix-container');
        container.innerHTML = '';

        const names = Array.from(this.matrices.keys()).sort();

        names.forEach(name => {
            const matrix = this.matrices.get(name);
            const rows = matrix.length;
            const cols = matrix[0]?.length || 0;

            const item = document.createElement('div');
            item.className = 'matrix-item';
            item.style.marginBottom = '8px';

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '4px';

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'matrix-select';
            radioInput.value = name;
            radioInput.checked = this.selectedMatrix === name;
            radioInput.addEventListener('change', () => {
                this.selectedMatrix = name;
                this.render();
            });

            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '6px';
            label.style.cursor = 'pointer';
            label.style.fontSize = '11px';
            label.style.color = 'var(--accent2)';
            label.style.fontWeight = 'bold';

            label.appendChild(radioInput);
            label.appendChild(document.createTextNode(name));
            header.appendChild(label);
            item.appendChild(header);

            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            grid.style.gap = '4px';

            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'matrix-input';
                    input.value = matrix[i][j];
                    input.addEventListener('change', (e) => {
                        matrix[i][j] = parseFloat(e.target.value) || 0;
                        this.render();
                    });
                    grid.appendChild(input);
                }
            }

            item.appendChild(grid);
            container.appendChild(item);
        });
    }

    resetCamera() {
        this.cameraRot = { ...this.cameraRotDefault };
        this.render();
    }

    matVecMult(matrix, vec) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const result = [];
        for (let i = 0; i < rows; i++) {
            let sum = 0;
            for (let j = 0; j < cols; j++) {
                sum += matrix[i][j] * vec[j];
            }
            result.push(sum);
        }
        return result;
    }

    lerpMatrix(identity, target, t) {
        const rows = identity.length;
        const cols = identity[0].length;
        const result = [];
        for (let i = 0; i < rows; i++) {
            result[i] = [];
            for (let j = 0; j < cols; j++) {
                result[i][j] = identity[i][j] + (target[i][j] - identity[i][j]) * t;
            }
        }
        return result;
    }

    render() {
        this.ctx.fillStyle = '#141820';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const matrix = this.matrices.get(this.selectedMatrix);
        if (!matrix) return;

        const rows = matrix.length;

        if (this.mode === '2d') {
            this.render2D(matrix);
        } else {
            this.render3D(matrix);
        }
    }

    render2D(matrix) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const unitSize = 40 * this.scale;
        const N = 5;

        const identity = [[1, 0], [0, 1]];
        const Mt = this.lerpMatrix(identity, matrix, this.t);

        if (this.showGrid) {
            this.ctx.strokeStyle = '#2a3040';
            this.ctx.lineWidth = 0.5;

            for (let x = -N; x <= N; x++) {
                this.ctx.beginPath();
                for (let y = -N; y <= N; y++) {
                    const vec = [x, y];
                    const transformed = this.matVecMult(Mt, vec);
                    const screenX = centerX + transformed[0] * unitSize;
                    const screenY = centerY - transformed[1] * unitSize;
                    
                    if (y === -N) {
                        this.ctx.moveTo(screenX, screenY);
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
                this.ctx.stroke();
            }

            for (let y = -N; y <= N; y++) {
                this.ctx.beginPath();
                for (let x = -N; x <= N; x++) {
                    const vec = [x, y];
                    const transformed = this.matVecMult(Mt, vec);
                    const screenX = centerX + transformed[0] * unitSize;
                    const screenY = centerY - transformed[1] * unitSize;
                    
                    if (x === -N) {
                        this.ctx.moveTo(screenX, screenY);
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
                this.ctx.stroke();
            }
        }

        if (this.showOriginalGrid) {
            this.ctx.strokeStyle = '#3a4050';
            this.ctx.lineWidth = 0.3;
            this.ctx.globalAlpha = 0.6;

            for (let x = -N; x <= N; x++) {
                this.ctx.beginPath();
                for (let y = -N; y <= N; y++) {
                    const screenX = centerX + x * unitSize;
                    const screenY = centerY - y * unitSize;
                    
                    if (y === -N) {
                        this.ctx.moveTo(screenX, screenY);
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
                this.ctx.stroke();
            }

            for (let y = -N; y <= N; y++) {
                this.ctx.beginPath();
                for (let x = -N; x <= N; x++) {
                    const screenX = centerX + x * unitSize;
                    const screenY = centerY - y * unitSize;
                    
                    if (x === -N) {
                        this.ctx.moveTo(screenX, screenY);
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
                this.ctx.stroke();
            }

            this.ctx.globalAlpha = 1.0;
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(centerX - 2, centerY - 2, 4, 4);

        if (this.showBasis) {
            const i_vec = this.matVecMult(Mt, [1, 0]);
            const i_screenX = centerX + i_vec[0] * unitSize;
            const i_screenY = centerY - i_vec[1] * unitSize;

            this.ctx.strokeStyle = '#ff5555';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(i_screenX, i_screenY);
            this.ctx.stroke();

            this.ctx.fillStyle = '#ff5555';
            this.ctx.font = 'bold 12px Courier New';
            this.ctx.fillText('i', i_screenX + 5, i_screenY - 5);

            const j_vec = this.matVecMult(Mt, [0, 1]);
            const j_screenX = centerX + j_vec[0] * unitSize;
            const j_screenY = centerY - j_vec[1] * unitSize;

            this.ctx.strokeStyle = '#55ffaa';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(j_screenX, j_screenY);
            this.ctx.stroke();

            this.ctx.fillStyle = '#55ffaa';
            this.ctx.fillText('j', j_screenX + 5, j_screenY - 5);

            this.ctx.fillStyle = 'rgba(74, 158, 255, 0.15)';
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(i_screenX, i_screenY);
            this.ctx.lineTo(i_screenX + j_screenX - centerX, i_screenY + j_screenY - centerY);
            this.ctx.lineTo(j_screenX, j_screenY);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.strokeStyle = 'rgba(74, 158, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            if (this.showOriginalGrid) {
                this.ctx.globalAlpha = 0.6;
                this.ctx.strokeStyle = '#9999dd';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX + unitSize, centerY);
                this.ctx.stroke();

                this.ctx.fillStyle = '#9999dd';
                this.ctx.fillText('i', centerX + unitSize + 5, centerY - 5);

                this.ctx.strokeStyle = '#66dd99';
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX, centerY - unitSize);
                this.ctx.stroke();

                this.ctx.fillStyle = '#66dd99';
                this.ctx.fillText('j', centerX + 5, centerY - unitSize - 5);

                this.ctx.globalAlpha = 1.0;
            }
        }
    }

    render3D(matrix) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const unitSize = 40 * this.scale;
        const N = 3;

        const identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const Mt = this.lerpMatrix(identity, matrix, this.t);

        const project = (vec) => {
            const rx = this.cameraRot.x;
            const ry = this.cameraRot.y;
            
            const x = vec[0];
            const y = vec[1];
            const z = vec[2];
            
            const x2 = x * Math.cos(ry) - z * Math.sin(ry);
            const z2 = x * Math.sin(ry) + z * Math.cos(ry);
            
            const y2 = y * Math.cos(rx) - z2 * Math.sin(rx);
            const z3 = y * Math.sin(rx) + z2 * Math.cos(rx);
            
            const scale = 1 / (1 + z3 * 0.1);
            return {
                x: centerX + x2 * scale * unitSize,
                y: centerY - y2 * scale * unitSize,
                z: z3
            };
        };

        const lines = [];
        
        for (let y = -N; y <= N; y++) {
            for (let z = -N; z <= N; z++) {
                for (let x = -N; x < N; x++) {
                    const p1 = this.matVecMult(Mt, [x, y, z]);
                    const p2 = this.matVecMult(Mt, [x + 1, y, z]);
                    const s1 = project(p1);
                    const s2 = project(p2);
                    const avgZ = (s1.z + s2.z) / 2;
                    lines.push({ s1, s2, avgZ, color: '#2a3040', original: false });
                }
            }
        }
        
        for (let x = -N; x <= N; x++) {
            for (let z = -N; z <= N; z++) {
                for (let y = -N; y < N; y++) {
                    const p1 = this.matVecMult(Mt, [x, y, z]);
                    const p2 = this.matVecMult(Mt, [x, y + 1, z]);
                    const s1 = project(p1);
                    const s2 = project(p2);
                    const avgZ = (s1.z + s2.z) / 2;
                    lines.push({ s1, s2, avgZ, color: '#2a3040', original: false });
                }
            }
        }
        
        for (let x = -N; x <= N; x++) {
            for (let y = -N; y <= N; y++) {
                for (let z = -N; z < N; z++) {
                    const p1 = this.matVecMult(Mt, [x, y, z]);
                    const p2 = this.matVecMult(Mt, [x, y, z + 1]);
                    const s1 = project(p1);
                    const s2 = project(p2);
                    const avgZ = (s1.z + s2.z) / 2;
                    lines.push({ s1, s2, avgZ, color: '#2a3040', original: false });
                }
            }
        }

        if (this.showOriginalGrid) {
            const origProjection = (vec) => {
                const rx = this.cameraRot.x;
                const ry = this.cameraRot.y;
                
                const x = vec[0];
                const y = vec[1];
                const z = vec[2];
                
                const x2 = x * Math.cos(ry) - z * Math.sin(ry);
                const z2 = x * Math.sin(ry) + z * Math.cos(ry);
                
                const y2 = y * Math.cos(rx) - z2 * Math.sin(rx);
                const z3 = y * Math.sin(rx) + z2 * Math.cos(rx);
                
                const scale = 1 / (1 + z3 * 0.1);
                return {
                    x: centerX + x2 * scale * unitSize,
                    y: centerY - y2 * scale * unitSize,
                    z: z3
                };
            };

            for (let y = -N; y <= N; y++) {
                for (let z = -N; z <= N; z++) {
                    for (let x = -N; x < N; x++) {
                        const s1 = origProjection([x, y, z]);
                        const s2 = origProjection([x + 1, y, z]);
                        const avgZ = (s1.z + s2.z) / 2;
                        lines.push({ s1, s2, avgZ, color: '#3a4050', original: true });
                    }
                }
            }
            
            for (let x = -N; x <= N; x++) {
                for (let z = -N; z <= N; z++) {
                    for (let y = -N; y < N; y++) {
                        const s1 = origProjection([x, y, z]);
                        const s2 = origProjection([x, y + 1, z]);
                        const avgZ = (s1.z + s2.z) / 2;
                        lines.push({ s1, s2, avgZ, color: '#3a4050', original: true });
                    }
                }
            }
            
            for (let x = -N; x <= N; x++) {
                for (let y = -N; y <= N; y++) {
                    for (let z = -N; z < N; z++) {
                        const s1 = origProjection([x, y, z]);
                        const s2 = origProjection([x, y, z + 1]);
                        const avgZ = (s1.z + s2.z) / 2;
                        lines.push({ s1, s2, avgZ, color: '#3a4050', original: true });
                    }
                }
            }
        }
        
        lines.sort((a, b) => a.avgZ - b.avgZ);
        
        this.ctx.lineWidth = 0.5;
        lines.forEach(line => {
            this.ctx.strokeStyle = line.color;
            if (line.original) {
                this.ctx.globalAlpha = 0.6;
                this.ctx.lineWidth = 0.3;
            } else {
                this.ctx.globalAlpha = 1.0;
                this.ctx.lineWidth = 0.5;
            }
            this.ctx.beginPath();
            this.ctx.moveTo(line.s1.x, line.s1.y);
            this.ctx.lineTo(line.s2.x, line.s2.y);
            this.ctx.stroke();
        });

        this.ctx.globalAlpha = 1.0;

        const orig = project([0, 0, 0]);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(orig.x - 2, orig.y - 2, 4, 4);

        const axisLen = 3;
        const axes = [
            { vec: [axisLen, 0, 0], color: '#ff5555', label: 'X' },
            { vec: [0, axisLen, 0], color: '#55ffaa', label: 'Y' },
            { vec: [0, 0, axisLen], color: '#ffdd33', label: 'Z' }
        ];
        
        axes.forEach(axis => {
            const end = project(this.matVecMult(Mt, axis.vec));
            this.ctx.strokeStyle = axis.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(orig.x, orig.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            this.ctx.fillStyle = axis.color;
            this.ctx.font = 'bold 14px Courier New';
            this.ctx.fillText(axis.label, end.x + 5, end.y - 5);
        });

        if (this.showBasis) {
            const colors = ['#ff5555', '#55ffaa', '#ffdd33'];
            const labels = ['i', 'j', 'k'];
            const vecs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

            for (let col = 0; col < 3; col++) {
                const vec_t = this.matVecMult(Mt, vecs[col]);
                const p = project(vec_t);

                this.ctx.strokeStyle = colors[col];
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(orig.x, orig.y);
                this.ctx.lineTo(p.x, p.y);
                this.ctx.stroke();

                this.ctx.fillStyle = colors[col];
                this.ctx.font = 'bold 12px Courier New';
                this.ctx.fillText(labels[col], p.x + 5, p.y - 5);
            }

            if (this.showOriginalGrid) {
                this.ctx.globalAlpha = 0.6;
                const origColors = ['#9999dd', '#66dd99', '#dddd66'];
                for (let col = 0; col < 3; col++) {
                    const origProjection = (vec) => {
                        const rx = this.cameraRot.x;
                        const ry = this.cameraRot.y;
                        const x = vec[0], y = vec[1], z = vec[2];
                        const x2 = x * Math.cos(ry) - z * Math.sin(ry);
                        const z2 = x * Math.sin(ry) + z * Math.cos(ry);
                        const y2 = y * Math.cos(rx) - z2 * Math.sin(rx);
                        const z3 = y * Math.sin(rx) + z2 * Math.cos(rx);
                        const s = 1 / (1 + z3 * 0.1);
                        return {
                            x: centerX + x2 * s * unitSize,
                            y: centerY - y2 * s * unitSize,
                            z: z3
                        };
                    };

                    const p = origProjection(vecs[col]);
                    this.ctx.strokeStyle = origColors[col];
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(orig.x, orig.y);
                    this.ctx.lineTo(p.x, p.y);
                    this.ctx.stroke();

                    this.ctx.fillStyle = origColors[col];
                    this.ctx.font = 'bold 12px Courier New';
                    this.ctx.fillText(labels[col], p.x + 5, p.y - 5);
                }
                this.ctx.globalAlpha = 1.0;
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MatrixApp();
});
