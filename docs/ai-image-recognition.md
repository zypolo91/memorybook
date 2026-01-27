# 证书图像识别方案调研

## 方案对比

### 方案一：第三方API（推荐起步）

| 服务商            | 优势               | 劣势         | 价格         |
| ----------------- | ------------------ | ------------ | ------------ |
| **百度OCR**       | 中文识别强、价格低 | 定制化低     | 免费500次/天 |
| **腾讯云OCR**     | 证件识别API        | 需自定义模板 | ¥0.5/次      |
| **阿里云OCR**     | 自定义模板         | 配置复杂     | ¥0.3/次      |
| **Azure Vision**  | 多语言支持         | 国内延迟高   | $1/1000次    |
| **Google Vision** | 精度高             | 需翻墙       | $1.5/1000次  |

### 方案二：边缘AI（Nano/Banana Pro等）

| 设备                   | 适用场景 | 成本   | 备注           |
| ---------------------- | -------- | ------ | -------------- |
| **NVIDIA Jetson Nano** | 实时推理 | ¥1000+ | 适合部署在店铺 |
| **Banana Pi Pro**      | 低成本   | ¥300+  | 算力有限       |
| **树莓派 + Coral TPU** | DIY方案  | ¥500+  | 需要调试       |

**适用场景**：线下门店实时验证，无需网络

### 方案三：自训练模型

**所需资源**：

- 训练数据：每机构500+张证书样本
- GPU算力：RTX 3090或云GPU
- 开发时间：2-4周

**模型选择**：

- **YOLOv8**：证书区域检测
- **PaddleOCR**：文字识别（中文优化）
- **ResNet/EfficientNet**：证书真伪分类

## 推荐方案

### 阶段一：快速上线（1-2周）

使用百度/腾讯OCR API：

```typescript
// 证书OCR识别
async function recognizeCertificate(imageUrl: string) {
  const result = await baiduOcr.generalBasic({
    image: imageUrl,
    language_type: 'CHN_ENG'
  });

  // 提取关键信息
  return {
    certNo: extractCertNo(result.words_result),
    institution: detectInstitution(result.words_result),
    gemType: extractGemType(result.words_result)
  };
}
```

### 阶段二：特征识别增强（2-4周）

添加防伪特征检测：

- 水印检测（图像处理）
- 全息标签识别（需训练）
- 二维码解析

### 阶段三：完整AI方案（1-2月）

自训练证书真伪分类模型：

1. 收集各机构证书样本
2. 标注防伪特征位置
3. 训练YOLOv8检测模型
4. 训练分类模型判断真伪

## 集成代码示例

```typescript
// src/service/certificate-recognition.service.ts

interface RecognitionResult {
  institution: string | null;
  certNumber: string | null;
  gemType: string | null;
  confidence: number;
  features: {
    watermark: boolean;
    hologram: boolean;
    qrCode: string | null;
  };
}

export class CertificateRecognitionService {
  // 使用百度OCR识别证书
  async recognizeWithBaiduOCR(imageBase64: string): Promise<RecognitionResult> {
    const response = await fetch(
      'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `access_token=${this.accessToken}&image=${encodeURIComponent(imageBase64)}`
      }
    );

    const data = await response.json();
    return this.parseOCRResult(data);
  }

  // 解析OCR结果
  private parseOCRResult(data: any): RecognitionResult {
    const text = data.words_result?.map((w: any) => w.words).join('\n') || '';

    return {
      institution: this.detectInstitution(text),
      certNumber: this.extractCertNumber(text),
      gemType: this.extractGemType(text),
      confidence: 0.8,
      features: {
        watermark: false, // 需图像处理检测
        hologram: false,
        qrCode: null
      }
    };
  }

  // 检测机构
  private detectInstitution(text: string): string | null {
    const institutions = ['GIA', 'NGTC', 'IGI', 'HRD', 'GTC', 'AGS'];
    for (const inst of institutions) {
      if (text.toUpperCase().includes(inst)) {
        return inst;
      }
    }
    return null;
  }

  // 提取证书编号
  private extractCertNumber(text: string): string | null {
    // GIA格式：10位数字
    const giaMatch = text.match(/\b\d{10}\b/);
    if (giaMatch) return giaMatch[0];

    // NGTC格式
    const ngtcMatch = text.match(/NGTC[\w-]+/i);
    if (ngtcMatch) return ngtcMatch[0];

    return null;
  }

  // 提取宝石类型
  private extractGemType(text: string): string | null {
    const gemTypes = {
      DIAMOND: '钻石',
      JADE: '翡翠',
      RUBY: '红宝石',
      SAPPHIRE: '蓝宝石',
      EMERALD: '祖母绿',
      PEARL: '珍珠'
    };

    for (const [en, cn] of Object.entries(gemTypes)) {
      if (text.toUpperCase().includes(en) || text.includes(cn)) {
        return cn;
      }
    }
    return null;
  }
}
```

## 结论

**推荐路线**：

1. 先用OCR API快速上线基础功能
2. 积累用户上传的证书图片数据
3. 根据数据量决定是否自训练模型

**不推荐**直接使用边缘设备（Nano等），因为：

- 用户场景是手机拍照上传，非实时检测
- 云端API更易维护和更新
- 成本更低，按需付费
