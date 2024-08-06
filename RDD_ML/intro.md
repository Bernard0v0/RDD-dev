# Model training guide

## **System environment**

Ubuntu 22.04.4 LTS\
CUDA version: 11.8\
CPU: Intel I5-12600KF\
Graphic card: RTX4070Ti\
Memory: 32GB

### Step1: install conda
Follow the [Conda Installation user guide](https://docs.conda.io/projects/conda/en/latest/user-guide/install/linux.html)
### Step2: Setup environment
Install cudatoolkit==11.8 with the [instruction](https://developer.nvidia.com/cuda-11-8-0-download-archive?target_os=Linux&target_arch=x86_64&Distribution=Ubuntu&target_version=22.04&target_type=runfile_local) \
```
nano ~/.bashrc
export PATH=/usr/local/cuda-11.8/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:$LD_LIBRARY_PATH
source ~/.bashrc
```
verify by: nvcc --version
```
conda create --name RDD-dev python=3.10 -y
conda activate RDD-dev
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu117
pip install -U openmim
mim install mmengine
mim install mmcv==2.1.0
cd RDD_ML/mmdetection
pip install -v -e .
cd ../
conda install tqdm
```

### Step3: Data preparation

```
cd ../datasets/RDD2022
wget https://bigdatacup.s3.ap-northeast-1.amazonaws.com/2022/CRDDC2022/RDD2022/Country_Specific_Data_CRDDC2022/RDD2022_Japan.zip
wget https://bigdatacup.s3.ap-northeast-1.amazonaws.com/2022/CRDDC2022/RDD2022/Country_Specific_Data_CRDDC2022/RDD2022_India.zip
wget https://bigdatacup.s3.ap-northeast-1.amazonaws.com/2022/CRDDC2022/RDD2022/Country_Specific_Data_CRDDC2022/RDD2022_Czech.zip
wget https://bigdatacup.s3.ap-northeast-1.amazonaws.com/2022/CRDDC2022/RDD2022/Country_Specific_Data_CRDDC2022/RDD2022_Norway.zip
wget https://bigdatacup.s3.ap-northeast-1.amazonaws.com/2022/CRDDC2022/RDD2022/Country_Specific_Data_CRDDC2022/RDD2022_United_States.zip
unzip RDD2022_Japan.zip
unzip RDD2022_India.zip
unzip RDD2022_Czech.zip
unzip RDD2022_Norway.zip
unzip RDD2022_United_States.zip
mv Czech/train/images/* train/images/
mv Czech/train/annotations/xmls/* train/annotations/xmls/
mv India/train/images/* train/images/
mv India/train/annotations/xmls/* train/annotations/xmls/
mv Japan/train/images/* train/images/
mv Japan/train/annotations/xmls/* train/annotations/xmls/
mv Norway/train/images/* train/images/
mv Norway/train/annotations/xmls/* train/annotations/xmls/
mv United_States/train/images/* train/images/
mv United_States/train/annotations/xmls/* train/annotations/xmls/
python data_pre-processing.py
```

### Step4: Model training

```
cd ../../mmdetection
ln -s ../datasets datasets
mkdir checkpoints
cd checkpoints
wget https://github.com/SwinTransformer/storage/releases/download/v1.0.0/swin_large_patch4_window7_224_22k.pth
cd ../
tools/dist_train.sh configs/RDD/RDD_model.py 1
```
# Model inference engine generation guide

```
# make sure prerequisite already met, otherwise install pytorch, torchvision, cudatoolkit,mmengine, mmecv==2.1.0 at fisrt
cd ../
pip install mmdeploy==1.3.1
pip install mmdeploy-runtime-gpu==1.3.1
pip install netron
# Then install cudnn==8.5.0.96, Tensorrt==8.6.1.6
# cudnn download link: https://developer.nvidia.com/compute/cudnn/secure/8.5.0/local_installers/11.7/cudnn-linux-x86_64-8.5.0.96_cuda11-archive.tar.xz
# Tensorrt download linl:https://developer.nvidia.com/downloads/compute/machine-learning/tensorrt/secure/8.6.1/tars/TensorRT-8.6.1.6.Linux.x86_64-gnu.cuda-11.8.tar.gz
tar -xvJf cudnn-linux-x86_64-8.5.0.96_cuda11-archive.tar.xz
cd /cudnn-linux-x86_64-8.5.96_cuda11-archive
sudo cp include/cudnn*.h /usr/local/cuda-11.8/include
sudo cp lib/libcudnn* /usr/local/cuda-11.8/lib64
sudo chmod a+r /usr/local/cuda-11.8/include/cudnn*.h /usr/local/cuda-11.8/lib64/libcudnn*
cd ../

tar -xzvf TensorRT-8.6.1.6.Linux.x86_64-gnu.cuda-11.8.tar.gz
sudo mv TensorRT-8.6.1.6 /usr/local/TensorRT-8.6.1
nano ~/.bashrc
export PATH=/usr/local/cuda-11.8/bin:/usr/local/TensorRT-8.6.1/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda-11.8/lib64:/usr/local/TensorRT-8.6.1/lib:$LD_LIBRARY_PATH
source ~/.bashrc

sudo ldconfig
# if some words appear after executing 'sudo ldconfig', such as ...is not a symbolic link, please refer to: https://queirozf.com/entries/installing-cuda-tk-and-tensorflow-on-a-clean-ubuntu-16-04-install#-sbin-ldconfig-real-usr-local-cuda-lib64-libcudnn-so-5-is-not-a-symbolic-link
# possible quick solution:
# sudo rm /usr/local/cuda-12.1/targets/x86_64-linux/lib/libcudnn*.so.8
# sudo ln -s /usr/local/cuda-12.1/targets/x86_64-linux/lib/libcudnn_adv_infer.so.8.x.x /usr/local/cuda-12.1/targets/x86_64-linux/lib/libcudnn_adv_infer.so.8

pip install onnxruntime-gpu
pip install onnxconverter-common
pip install tensorrt==8.6.1

git clone -b main --recursive https://github.com/open-mmlab/mmdeploy.git

mv detection_tensorrt-fp16_static-640x640.py mmdeploy/configs/mmdet/detection

wget https://github.com/microsoft/onnxruntime/releases/download/v1.18.1/onnxruntime-linux-x64-gpu-1.18.1.tgz
tar -zxvf onnxruntime-linux-x64-gpu-1.18.1.tgz

# when transferring torch model to tensorrt engine, might encounter with error: failed:Fatal error: mmdeploy:xxx(-1) is not a registered function/op
# This may due to onnxruntime may not be installed correctly (not just pip install). please refer to: https://github.com/open-mmlab/mmdeploy/issues/2377
# possible solution: run 'session_options.register_custom_ops_library(${path/to/mmdeploy/lib/libmmdeploy_onnxruntime_ops.so})' for one time after converting to onnx / verifying onnxruntime-gpu installation
# torch to onnx
python mmdeploy/tools/deploy.py \
    mmdeploy/configs/mmdet/detection/detection_onnxruntime_dynamic.py \
    mmdetection/configs/RDD/RDD_model.py \
    mmdetection/checkpoints/RDD1.pth \
    datasets/RDD2022/demo.jpg \
    --work-dir mmdeploy_model/faster-rcnn \
    --device cpu \
    --dump-info

python mmdeploy/tools/deploy.py \
    mmdeploy/configs/mmdet/detection/detection_onnxruntime_static.py \
    mmdetection/configs/RDD/RDD_model.py \
    mmdetection/checkpoints/RDD1.pth \
    datasets/RDD2022/demo.jpg \
    --work-dir mmdeploy_model/faster-rcnn-static\
    --device cpu \
    --dump-info

#torch to tensorrt
python mmdeploy/tools/deploy.py \
    mmdeploy/configs/mmdet/detection/detection_tensorrt-fp16_static-640x640.py \
    mmdetection/configs/RDD/RDD_model.py \
    mmdetection/checkpoints/RDD1.pth \
    datasets/RDD2022/demo.jpg \
    --work-dir mmdeploy_model/swin-transformer-faster-rcnn-static \
    --device cuda \
    --dump-info

python mmdeploy/tools/deploy.py \
    mmdeploy/configs/mmdet/detection/detection_tensorrt-fp16_dynamic-320x320-1344x1344.py \
    mmdetection/configs/RDD/RDD_model.py \
    mmdetection/checkpoints/RDD1.pth \
    datasets/RDD2022/demo.jpg \
    --work-dir mmdeploy_model/swin-transformer-faster-rcnn-dynamic \
    --device cuda \
    --dump-info


```


