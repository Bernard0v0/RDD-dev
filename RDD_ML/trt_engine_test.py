
from mmdeploy_runtime import Detector
import cv2
import time

img = cv2.imread('datasets/RDD2022/demo.jpg')
detector = Detector(model_path='mmdeploy_model/swin-transformer-faster-rcnn-dynamic', device_name='cuda', device_id=0)
start = time.time()
bboxes, labels, _ = detector(img)
indices = [i for i in range(len(bboxes))]
for index, bbox, label_id in zip(indices, bboxes, labels):
  [left, top, right, bottom], score = bbox[0:4].astype(int),  bbox[4]
  print([left, top, right, bottom], score,label_id)
  if score < 0.75:
      continue
  cv2.rectangle(img, (left, top), (right, bottom), (0, 255, 0))
end = time.time()
cv2.imwrite('output_detection.png', img)
print("Inference Time:", end - start)

