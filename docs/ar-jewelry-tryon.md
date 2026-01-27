# AR珠宝试戴功能设计

## 功能概述

通过AR技术让用户在手机上虚拟试戴珠宝，提升购买决策体验。

## 技术方案对比

### 方案一：ARKit/ARCore + Flutter

| 平台    | 技术   | Flutter插件           |
| ------- | ------ | --------------------- |
| iOS     | ARKit  | arkit_plugin          |
| Android | ARCore | arcore_flutter_plugin |

**优势**：原生性能最佳
**劣势**：需要分平台开发，3D资源要求高

### 方案二：WebAR + WebView

| 框架         | 特点               | 适用场景  |
| ------------ | ------------------ | --------- |
| **8th Wall** | 商业方案，效果最好 | 预算充足  |
| **AR.js**    | 开源免费           | 简单展示  |
| **MindAR**   | 开源，人脸跟踪好   | 耳环/眼镜 |
| **Zappar**   | 商业，易集成       | 中等预算  |

**优势**：跨平台，热更新
**劣势**：性能略低于原生

### 方案三：第三方SDK（推荐）

| SDK              | 价格     | 功能               |
| ---------------- | -------- | ------------------ |
| **Banuba**       | 商业授权 | 美颜+AR滤镜+首饰   |
| **DeepAR**       | 按月付费 | 人脸AR，首饰效果好 |
| **Perfect Corp** | 企业定制 | 珠宝行业专业方案   |

## 推荐方案

### 戒指试戴

**技术要点**：

- 手部姿态估计（MediaPipe Hands）
- 手指关节检测
- 戒指3D模型贴合

```dart
// Flutter伪代码
class RingTryOnPage extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return ARView(
      onHandDetected: (hand) {
        // 检测到手部
        final ringFinger = hand.landmarks[14]; // 无名指
        positionRingModel(ringFinger);
      },
    );
  }
}
```

### 耳环试戴

**技术要点**：

- 人脸检测（面部landmark）
- 耳朵位置追踪
- 耳环模型定位

**推荐使用**：MindAR 或 DeepAR（人脸跟踪成熟）

### 项链试戴

**技术要点**：

- 人体姿态估计
- 颈部位置检测
- 项链弧度适配

**挑战**：项链需要根据颈部弧度变形，技术复杂度高

## 实现路线图

### Phase 1: 基础AR预览（2周）

```
目标：静态3D珠宝模型展示
技术：model_viewer (Flutter)
功能：
- 360度旋转查看
- 缩放
- 背景切换
```

### Phase 2: 简单试戴（4周）

```
目标：耳环试戴功能
技术：WebAR (MindAR) + WebView
功能：
- 人脸检测
- 耳环贴合
- 拍照分享
```

### Phase 3: 完整试戴（8周）

```
目标：戒指、项链试戴
技术：原生ARKit/ARCore或第三方SDK
功能：
- 手势检测
- 多种珠宝类型
- 实时光影效果
```

## Flutter集成代码

### 基础3D预览

```yaml
# pubspec.yaml
dependencies:
  model_viewer_plus: ^1.6.0
```

```dart
import 'package:model_viewer_plus/model_viewer_plus.dart';

class JewelryViewer extends StatelessWidget {
  final String modelUrl;

  @override
  Widget build(BuildContext context) {
    return ModelViewer(
      src: modelUrl, // .glb 或 .gltf 格式
      alt: "珠宝3D模型",
      ar: true,
      arModes: ['scene-viewer', 'webxr', 'quick-look'],
      autoRotate: true,
      cameraControls: true,
      backgroundColor: Color(0xFFEEEEEE),
    );
  }
}
```

### WebAR集成

```dart
class EarringTryOn extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return WebViewWidget(
      controller: WebViewController()
        ..loadRequest(Uri.parse('https://your-domain.com/ar-tryon'))
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..addJavaScriptChannel(
          'FlutterBridge',
          onMessageReceived: (message) {
            // 处理拍照等回调
            if (message.message == 'capture') {
              // 保存图片
            }
          },
        ),
    );
  }
}
```

## 3D资源要求

| 类型 | 格式 | 大小限制 | 多边形数 |
| ---- | ---- | -------- | -------- |
| 戒指 | .glb | <2MB     | <50K     |
| 耳环 | .glb | <1MB     | <30K     |
| 项链 | .glb | <3MB     | <80K     |

**工具推荐**：

- Blender（免费建模）
- Substance Painter（材质）
- RealityCapture（实物扫描）

## 成本估算

| 方案       | 开发成本 | 运营成本   |
| ---------- | -------- | ---------- |
| 基础3D预览 | ¥5,000   | 免费       |
| WebAR试戴  | ¥20,000  | 服务器费用 |
| 原生AR+SDK | ¥50,000+ | SDK授权费  |

## 建议

1. **先做3D预览**：model_viewer_plus快速实现
2. **再做耳环试戴**：WebAR技术成熟，效果好
3. **戒指/项链后续**：等积累用户反馈后决定

## 数据库支持

需要在商品表添加3D模型字段：

```typescript
// schema.ts 扩展
jewelry3dModel: varchar('jewelry_3d_model', { length: 500 }), // .glb模型URL
arEnabled: boolean('ar_enabled').default(false),
arType: varchar('ar_type', { length: 20 }), // ring, earring, necklace
```
