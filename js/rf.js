let originalImage = null;
        let selection = null;
        let isSelecting = false;
        let selectionStart = { x: 0, y: 0 };
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const selectionBox = document.getElementById('selectionBox');
        const loading = document.querySelector('.loading');
        const offsetSlider = document.getElementById('offset');
        const opacitySlider = document.getElementById('opacity');
        const offsetValue = document.getElementById('offsetValue');
        const opacityValue = document.getElementById('opacityValue');

        // 根据当前选择和位置更新偏移量的最大值
        function updateMaxOffset() {
            if (!originalImage) return;
            
            const position = document.getElementById('position').value;
            const offsetSlider = document.getElementById('offset');
            
            let maxOffset;
            
            // 根据是否有选区和镜像位置计算最大偏移量
            if (selection) {
                switch(position) {
                    case 'below':
                    case 'above':
                        // 对于上下镜像，最大偏移量为选区高度
                        maxOffset = selection.height;
                        break;
                    case 'left':
                    case 'right':
                        // 对于左右镜像，最大偏移量为选区宽度
                        maxOffset = selection.width;
                        break;
                }
            } else {
                // 如果没有选区，使用整个图像
                switch(position) {
                    case 'below':
                    case 'above':
                        maxOffset = Math.floor(originalImage.height / 3);
                        break;
                    case 'left':
                    case 'right':
                        maxOffset = Math.floor(originalImage.width / 3);
                        break;
                }
            }
            
            // 确保最大偏移量至少为10像素
            maxOffset = Math.max(10, maxOffset);
            
            // 更新滑块最大值
            offsetSlider.max = maxOffset;
            
            // 如果当前值超过了新的最大值，则调整当前值
            if (parseInt(offsetSlider.value) > maxOffset) {
                offsetSlider.value = maxOffset;
                document.getElementById('offsetValue').textContent = `${maxOffset}px`;
                drawImage();
            }
        }

        // 更新滑块值显示
        offsetSlider.addEventListener('input', function() {
            offsetValue.textContent = `${offsetSlider.value}px`;
            drawImage();
        });

        opacitySlider.addEventListener('input', function() {
            opacityValue.textContent = `${opacitySlider.value}%`;
            drawImage();
        });

        // 文件上传
        document.getElementById('imageUpload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            loading.style.display = 'flex';

            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    document.getElementById('save').disabled = false;
                    resetSelection();
                    
                    // 根据图片尺寸调整最大偏移量
                    updateMaxOffset();
                    
                    drawImage();
                    loading.style.display = 'none';
                };
                img.onerror = function() {
                    alert('图片加载失败，请尝试其他图片。');
                    loading.style.display = 'none';
                };
                img.src = event.target.result;
            };
            reader.onerror = function() {
                alert('文件读取失败，请重试。');
                loading.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });

        // 框选开始
        document.getElementById('startSelect').addEventListener('click', () => {
            if (!originalImage) {
                alert('请先上传图片');
                return;
            }

            isSelecting = true;
            canvas.style.cursor = 'crosshair';
            document.getElementById('startSelect').disabled = true;
            document.getElementById('cancelSelect').disabled = false;
            selectionBox.style.display = 'none';
        });

        // 取消框选
        document.getElementById('cancelSelect').addEventListener('click', () => {
            isSelecting = false;
            selection = null;
            selectionBox.style.display = 'none';
            document.getElementById('startSelect').disabled = false;
            document.getElementById('cancelSelect').disabled = true;
            canvas.style.cursor = 'default';
            updateMaxOffset();
            drawImage();
        });

        // 鼠标事件处理
        canvas.addEventListener('mousedown', (e) => {
            if (!isSelecting || !originalImage) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // 保存选择起点（画布坐标系）
            selectionStart = {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };

            // 显示选择框（客户端坐标系）
            selectionBox.style.left = `${e.clientX - rect.left}px`;
            selectionBox.style.top = `${e.clientY - rect.top}px`;
            selectionBox.style.width = '0';
            selectionBox.style.height = '0';
            selectionBox.style.display = 'block';

            const mouseMove = (e) => {
                if (!isSelecting) return;
                
                const currentX = (e.clientX - rect.left) * scaleX;
                const currentY = (e.clientY - rect.top) * scaleY;

                // 计算选择框（画布坐标系）
                const canvasLeft = Math.min(selectionStart.x, currentX);
                const canvasTop = Math.min(selectionStart.y, currentY);
                const canvasWidth = Math.abs(currentX - selectionStart.x);
                const canvasHeight = Math.abs(currentY - selectionStart.y);

                // 更新选择框显示（客户端坐标系）
                const displayLeft = Math.min(e.clientX - rect.left, (selectionStart.x / scaleX));
                const displayTop = Math.min(e.clientY - rect.top, (selectionStart.y / scaleY));
                const displayWidth = Math.abs((e.clientX - rect.left) - (selectionStart.x / scaleX));
                const displayHeight = Math.abs((e.clientY - rect.top) - (selectionStart.y / scaleY));

                if (canvasWidth > 10 && canvasHeight > 10) {
                    selectionBox.style.left = `${displayLeft}px`;
                    selectionBox.style.top = `${displayTop}px`;
                    selectionBox.style.width = `${displayWidth}px`;
                    selectionBox.style.height = `${displayHeight}px`;
                }
            };

            const mouseUp = () => {
                if (!isSelecting) return;
                isSelecting = false;
                document.removeEventListener('mousemove', mouseMove);
                document.removeEventListener('mouseup', mouseUp);

                // 获取最终选区（画布坐标系）
                if (selectionBox.style.width !== '0px' && selectionBox.style.height !== '0px') {
                    const width = parseFloat(selectionBox.style.width) * scaleX;
                    const height = parseFloat(selectionBox.style.height) * scaleY;
                    const left = Math.min(selectionStart.x, selectionStart.x + width);
                    const top = Math.min(selectionStart.y, selectionStart.y + height);

                    // 确保选区尺寸足够大
                    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
                        selection = {
                            x: left,
                            y: top,
                            width: Math.abs(width),
                            height: Math.abs(height)
                        };
                        // 只有在有有效选区时才启用取消按钮
                        document.getElementById('cancelSelect').disabled = false;
                        
                        // 更新偏移量限制
                        updateMaxOffset();
                    } else {
                        selection = null;
                        selectionBox.style.display = 'none';
                    }
                } else {
                    selection = null;
                    selectionBox.style.display = 'none';
                }

                document.getElementById('startSelect').disabled = false;
                canvas.style.cursor = 'default';
                drawImage();
            };

            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('mouseup', mouseUp);
        });

        // 绘制图像和镜像效果
        function drawImage(showSelection = true) {
            if (!originalImage) return;

            // 设置画布尺寸
            canvas.width = originalImage.width;
            canvas.height = originalImage.height;
            
            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制原始图像
            ctx.drawImage(originalImage, 0, 0);

            // 确定镜像区域
            const target = selection || {
                x: 0,
                y: 0,
                width: originalImage.width,
                height: originalImage.height
            };

            // 获取当前设置
            const position = document.getElementById('position').value;
            const offset = parseInt(document.getElementById('offset').value);
            const opacity = parseInt(document.getElementById('opacity').value) / 100;

            // 创建临时画布处理镜像区域
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 根据不同位置计算源区域和镜像效果
            switch(position) {
                case 'below':
                    // 确保偏移量不超过选区高度
                    const effectiveOffsetBelow = Math.min(offset, target.height);
                    
                    // 设置临时画布尺寸
                    tempCanvas.width = target.width;
                    tempCanvas.height = effectiveOffsetBelow;
                    
                    // 绘制要镜像的部分到临时画布
                    tempCtx.save();
                    tempCtx.translate(0, tempCanvas.height);
                    tempCtx.scale(1, -1);
                    tempCtx.drawImage(
                        originalImage,
                        target.x, 
                        target.y + target.height - effectiveOffsetBelow,
                        target.width, 
                        effectiveOffsetBelow,
                        0, 
                        0,
                        target.width, 
                        effectiveOffsetBelow
                    );
                    tempCtx.restore();
                    
                    // 绘制镜像效果到主画布
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(
                        tempCanvas,
                        0, 
                        0,
                        tempCanvas.width, 
                        tempCanvas.height,
                        target.x, 
                        target.y + target.height,
                        target.width, 
                        effectiveOffsetBelow
                    );
                    ctx.restore();
                    break;
                    
                case 'above':
                    // 确保偏移量不超过选区高度
                    const effectiveOffsetAbove = Math.min(offset, target.height);
                    
                    // 设置临时画布尺寸
                    tempCanvas.width = target.width;
                    tempCanvas.height = effectiveOffsetAbove;
                    
                    // 绘制要镜像的部分到临时画布
                    tempCtx.save();
                    tempCtx.translate(0, tempCanvas.height);
                    tempCtx.scale(1, -1);
                    tempCtx.drawImage(
                        originalImage,
                        target.x, 
                        target.y,
                        target.width, 
                        effectiveOffsetAbove,
                        0, 
                        0,
                        target.width, 
                        effectiveOffsetAbove
                    );
                    tempCtx.restore();
                    
                    // 绘制镜像效果到主画布
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(
                        tempCanvas,
                        0, 
                        0,
                        tempCanvas.width, 
                        tempCanvas.height,
                        target.x, 
                        target.y - effectiveOffsetAbove,
                        target.width, 
                        effectiveOffsetAbove
                    );
                    ctx.restore();
                    break;
                    
                case 'left':
                    // 确保偏移量不超过选区宽度
                    const effectiveOffsetLeft = Math.min(offset, target.width);
                    
                    // 设置临时画布尺寸
                    tempCanvas.width = effectiveOffsetLeft;
                    tempCanvas.height = target.height;
                    
                    // 绘制要镜像的部分到临时画布
                    tempCtx.save();
                    tempCtx.translate(tempCanvas.width, 0);
                    tempCtx.scale(-1, 1);
                    tempCtx.drawImage(
                        originalImage,
                        target.x, 
                        target.y,
                        effectiveOffsetLeft, 
                        target.height,
                        0, 
                        0,
                        effectiveOffsetLeft, 
                        target.height
                    );
                    tempCtx.restore();
                    
                    // 绘制镜像效果到主画布
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(
                        tempCanvas,
                        0, 
                        0,
                        tempCanvas.width, 
                        tempCanvas.height,
                        target.x - effectiveOffsetLeft, 
                        target.y,
                        effectiveOffsetLeft, 
                        target.height
                    );
                    ctx.restore();
                    break;
                    
                case 'right':
                    // 确保偏移量不超过选区宽度
                    const effectiveOffsetRight = Math.min(offset, target.width);
                    
                    // 设置临时画布尺寸
                    tempCanvas.width = effectiveOffsetRight;
                    tempCanvas.height = target.height;
                    
                    // 绘制要镜像的部分到临时画布
                    tempCtx.save();
                    tempCtx.translate(tempCanvas.width, 0);
                    tempCtx.scale(-1, 1);
                    tempCtx.drawImage(
                        originalImage,
                        target.x + target.width - effectiveOffsetRight, 
                        target.y,
                        effectiveOffsetRight, 
                        target.height,
                        0, 
                        0,
                        effectiveOffsetRight, 
                        target.height
                    );
                    tempCtx.restore();
                    
                    // 绘制镜像效果到主画布
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.drawImage(
                        tempCanvas,
                        0, 
                        0,
                        tempCanvas.width, 
                        tempCanvas.height,
                        target.x + target.width, 
                        target.y,
                        effectiveOffsetRight, 
                        target.height
                    );
                    ctx.restore();
                    break;
            }

            // 只有在预览模式且有选区时才绘制选区边框
            if (showSelection && selection) {
                ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
            }
        }