# Model training guide

## **System environment**

Ubuntu 22.04.4 LTS\
CUDA version: 11.7\
CPU: Intel I5-12600KF\
Graphic card: RTX4070Ti\
Memory: 32GB

### Step1: install conda

### Step2: Setup environment

```
conda create --name RDD-dev python=3.10 -y
conda activate RDD-dev
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu117
pip install -U openmim
mim install mmengine
mim install mmcv
git clone https://github.com/open-mmlab/mmdetection.git
cd mmdetection
pip install -v -e .
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
wget https://github.com/SwinTransformer/storage/releases/download/v1.0.0/swin_large_patch4_window12_384_22k.pth
cd ../
tools/dist_train.sh configs/RDD/RDD_model.py 1
```