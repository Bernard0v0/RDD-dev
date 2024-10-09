
import os

from datetime import datetime
from botocore.exceptions import ClientError
import requests
from flask import Flask, jsonify,request
from flask_sqlalchemy import SQLAlchemy
from mmdeploy_runtime import Detector
import cv2
import time
import boto3
import uuid
import numpy as np
import onnx
import onnxruntime as rt
import json
app = Flask(__name__)
db = SQLAlchemy()
def get_secret():

    secret_name = "xxx"
    region_name = "xxx"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    return get_secret_value_response['SecretString']
database_info = get_secret()
db_config = json.loads(database_info)

# Construct the SQLAlchemy database URI
username = db_config['username']
password = db_config['password']
host = db_config['host']
port = db_config['port']
# Configure the database connection (MySQL)
app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{username}:{password}@{host}:{port}/RDD"
db.init_app(app)

# Define color map for different labels/types
color_map = {
    0: (0, 255, 0),
    1: (255, 0, 0),
    2: (0, 0, 255),
    3: (255, 255, 0)
}

# database model
class Def(db.Model):
    __tablename__ = 'def'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    img_id = db.Column(db.Integer, nullable=False)
    img_url = db.Column(db.String(255), nullable=False)
    coord_left = db.Column(db.Integer, nullable=False)
    coord_top = db.Column(db.Integer, nullable=False)
    coord_right = db.Column(db.Integer, nullable=False)
    coord_bottom = db.Column(db.Integer, nullable=False)
    conf = db.Column(db.Numeric(7, 4), nullable=False)
    type = db.Column(db.Integer, nullable=False)
    stat = db.Column(db.Integer, default=0, nullable=False)
    delete_flag = db.Column(db.String(1), default='N', nullable=False)
    created_by = db.Column(db.String(255), nullable=False)
    created_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_by = db.Column(db.String(255), nullable=False)
    updated_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Det(db.Model):
    __tablename__ = 'det'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    img_source_url = db.Column(db.String(255), nullable=False)
    img_url = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Numeric(7, 4), nullable=False)
    longitude = db.Column(db.Numeric(7, 4), nullable=False)
    def_num = db.Column(db.Integer)
    description = db.Column(db.String(500), default='', nullable=False)
    detect_flag = db.Column(db.String(1), default='N', nullable=False)
    delete_flag = db.Column(db.String(1), default='N', nullable=False)
    created_by = db.Column(db.String(255), nullable=False)
    created_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_by = db.Column(db.String(255), nullable=False)
    updated_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

# S3 config
s3 = boto3.resource(service_name='s3',
                    region_name='xxx',
                    )


def update_det(id,new_url,def_num):
    det = Det.query.get(id)
    det.img_url = new_url
    det.def_num = def_num
    det.detect_flag = 'Y'
    det.updated_by = "RDD inference engine"
    det.updated_time = datetime.now()
    db.session.flush()
def update_det_url(id,new_url):
    det = Det.query.get(id)
    det.img_url = new_url
    det.updated_time = datetime.now()
    db.session.flush()
def update_def_url(id,new_url):
    defect = Def.query.get(id)
    defect.img_url = new_url
    defect.updated_time = datetime.now()
    db.session.flush()
def insert_def(data):
    new_def = Def(
        img_id=data['img_id'],
        img_url='',
        coord_left=data['coord_left'],
        coord_top=data['coord_top'],
        coord_right=data['coord_right'],
        coord_bottom=data['coord_bottom'],
        conf=data['conf'],
        type=data['type'],
        stat=0,
        delete_flag="N",
        created_by="RDD inference engine",
        created_time=datetime.now(),
        updated_by="RDD inference engine",
        updated_time=datetime.now()
    )
    db.session.add(new_def)
    db.session.flush()
    return new_def.id
def delete_det(id):
    det = Det.query.get(id)
    if det:
        db.session.delete(det)
        db.session.flsuh()
def get_def(img_id):
    results = Def.query.filter_by(img_id=img_id, delete_flag='N').all()
    def_list = []
    for def_entry in results:
        def_list.append({
            'id': def_entry.id,
            'img_id': def_entry.img_id,
            'coord_left': def_entry.coord_left,
            'coord_top': def_entry.coord_top,
            'coord_right': def_entry.coord_right,
            'coord_bottom': def_entry.coord_bottom,
            'conf': str(def_entry.conf),
            'type': def_entry.type,
            'stat': def_entry.stat,
            'delete_flag': def_entry.delete_flag,
            'create_by': def_entry.created_by,
            'created_time': def_entry.created_time.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_by': def_entry.updated_by,
            'updated_time': def_entry.updated_time.strftime('%Y-%m-%d %H:%M:%S')
        })
    return def_list


def get_def_by_id(def_id):
    def_entry = Def.query.get(def_id)
    if def_entry:
        return {
            'id': def_entry.id,
            'img_id': def_entry.img_id,
            'img_url': def_entry.img_url,
            'coord_left': def_entry.coord_left,
            'coord_top': def_entry.coord_top,
            'coord_right': def_entry.coord_right,
            'coord_bottom': def_entry.coord_bottom,
            'conf': str(def_entry.conf),
            'type': def_entry.type,
            'stat': def_entry.stat,
            'delete_flag': def_entry.delete_flag,
            'created_by': def_entry.created_by,
            'created_time': def_entry.created_time.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_by': def_entry.updated_by,
            'updated_time': def_entry.updated_time.strftime('%Y-%m-%d %H:%M:%S')
        }
    else:
        return None
def get_img_source_url(img_id):
    return Det.query.with_entities(Det.img_source_url).filter_by(id=img_id).first()[0]
def get_img_url(img_id):
    return Det.query.with_entities(Det.img_url).filter_by(id=img_id).first()[0]

# image detection request
@app.route('/ml/img_detection', methods=['POST'])
def detect():
    uploaded_files = []  # record the uploaded images to S3
    try:
        with db.session.begin():
            # set model output
            outputs_name = ['dets', 'labels']

            # fetch the image from the provided URL
            data = request.json
            img_id = data.get('id')
            img_source_url = data.get('img_source_url')
            response = requests.get(img_source_url)
            response.raise_for_status()
            image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
            img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

            # get original image name
            origion_source_name = os.path.basename(img_source_url)

            coords = []
            scores = []
            cat_id = []
            # collect result resize result coord back to the original size
            response = requests.get(img_source_url)
            response.raise_for_status()
            image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
            img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            single_img = img.copy()
            bboxes, labels, _ = detector(img)
            indices = [i for i in range(len(bboxes))]
            for index, bbox, label_id in zip(indices, bboxes, labels):
                [left, top, right, bottom], score = bbox[:4], bbox[4]
                if score < 0.75:
                    continue
                coords.append([left, top, right, bottom])
                scores.append(float(score))
                cat_id.append(int(label_id))

            if coords:
                unique_id = uuid.uuid4()
                file_name = str(unique_id) + ".jpg"

                for i in range(len(coords)):
                    single_img_c = single_img.copy()
                    single_unique_id = uuid.uuid4()
                    single_file_name = str(single_unique_id) + ".jpg"
                    color = color_map.get(cat_id[i], (0, 0, 0))
                    cv2.rectangle(img, (coords[i][0], coords[i][1]), (coords[i][2], coords[i][3]), color, 2)
                    cv2.rectangle(single_img_c, (coords[i][0], coords[i][1]), (coords[i][2], coords[i][3]), color, 2)

                    defect = {
                        "img_id": img_id,
                        "coord_left": coords[i][0],
                        "coord_top": coords[i][1],
                        "coord_right": coords[i][2],
                        "coord_bottom": coords[i][3],
                        "conf": scores[i],
                        "type": cat_id[i]
                    }
                    def_id = insert_def(defect)

                    label = str(def_id)
                    (text_width, text_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_PLAIN, 0.6, 1)
                    text_org = (coords[i][0] + 3, coords[i][1] + text_height + 3)

                    cv2.rectangle(img, (coords[i][0], coords[i][1]),
                                  (coords[i][0] + text_width + 6, coords[i][1] + text_height + 6), (0, 0, 0), -1)
                    cv2.putText(img, label, text_org, cv2.FONT_HERSHEY_PLAIN, 0.8, (255, 255, 255), 0)
                    cv2.rectangle(single_img_c, (coords[i][0], coords[i][1]),
                                  (coords[i][0] + text_width + 6, coords[i][1] + text_height + 6), (0, 0, 0), -1)
                    cv2.putText(single_img_c, label, text_org, cv2.FONT_HERSHEY_PLAIN, 0.8, (255, 255, 255), 0)

                    cv2.imwrite(single_file_name, single_img_c)
                    s3.Bucket('xxx').upload_file(single_file_name, single_file_name, ExtraArgs={'ACL': 'public-read'})
                    uploaded_files.append(single_file_name)  
                    new_url = f"xxx/{single_file_name}"
                    update_def_url(def_id, new_url)
                    os.remove(single_file_name)

                cv2.imwrite(file_name, img)
                s3.Bucket('xxx').upload_file(file_name, file_name, ExtraArgs={'ACL': 'public-read'})
                uploaded_files.append(file_name)
                new_url = f"xxx/{file_name}"
                update_det(img_id, new_url, len(cat_id))
                os.remove(file_name)

                return jsonify({"code": 0})
            else:
                delete_det(img_id)
                s3.Object('xxx', origion_source_name).delete()
                return jsonify({"code": 1})

    except Exception as e:
        # rollback database update
        db.session.rollback()

        # rollback the uploaded images
        for file in uploaded_files:
            try:
                s3.Object('xxx', file).delete()
            except Exception as s3_e:
                app.logger.error(f"Failed to delete S3 object {file}: {s3_e}")
        
        return jsonify({"code": 1})

    
# img update request (update/delete defect)
@app.route('/ml/update_img', methods=['POST'])
def draw_img():
    uploaded_files = []  # record the uploaded images to S3
    try:
        with db.session.begin():
            # get the original image
            data = request.json
            img_id = data.get('id')
            def_id = data.get('def_id')
            img_source_url = get_img_source_url(img_id)
            img_url = get_img_url(img_id)
            origion_name = os.path.basename(img_url)

            s3.Object('xxx', origion_name).delete()

            if data.get('del_mark') == "N":
                response = requests.get(img_source_url)
                response.raise_for_status()
                image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
                img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                single_img = img.copy()
                def_list = get_def(img_id)
                unique_id = uuid.uuid4()
                file_name = str(unique_id) + ".jpg"

                for i in range(len(def_list)):
                    color = color_map.get(def_list[i]['type'], (0, 0, 0))
                    cv2.rectangle(img, (def_list[i]['coord_left'], def_list[i]['coord_top']),
                                  (def_list[i]['coord_right'], def_list[i]['coord_bottom']), color, 2)
                    label = str(def_list[i]['id'])
                    (text_width, text_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_PLAIN, 0.6, 1)
                    text_org = (def_list[i]['coord_left'] + 3, def_list[i]['coord_top'] + text_height + 3)
                    cv2.rectangle(img, (def_list[i]['coord_left'], def_list[i]['coord_top']),
                                  (def_list[i]['coord_left'] + text_width + 6, def_list[i]['coord_top'] + text_height + 6),
                                  (0, 0, 0), -1)
                    cv2.putText(img, label, text_org, cv2.FONT_HERSHEY_PLAIN, 0.8, (255, 255, 255), 0)

                cv2.imwrite(file_name, img)
                s3.Bucket('xxx').upload_file(file_name, file_name, ExtraArgs={'ACL': 'public-read'})
                uploaded_files.append(file_name)
                new_url = f"xxx/{file_name}"
                update_det_url(img_id, new_url)
                os.remove(file_name)

                if def_id != -1:
                    defect = get_def_by_id(def_id)
                    if defect:
                        color = color_map.get(defect['type'], (0, 0, 0))
                        unique_id = uuid.uuid4()
                        single_file_name = str(unique_id) + ".jpg"
                        cv2.rectangle(single_img, (defect['coord_left'], defect['coord_top']),
                                      (defect['coord_right'], defect['coord_bottom']), color, 2)
                        label = str(defect['id'])
                        (text_width, text_height), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_PLAIN, 0.6, 1)
                        text_org = (defect['coord_left'] + 3, defect['coord_top'] + text_height + 3)
                        cv2.rectangle(single_img, (defect['coord_left'], defect['coord_top']),
                                      (defect['coord_left'] + text_width + 6, defect['coord_top'] + text_height + 6),
                                      (0, 0, 0), -1)
                        cv2.putText(single_img, label, text_org, cv2.FONT_HERSHEY_PLAIN, 0.8, (255, 255, 255), 0)

                        cv2.imwrite(single_file_name, single_img)
                        s3.Bucket('xxx').upload_file(single_file_name, single_file_name, ExtraArgs={'ACL': 'public-read'})
                        uploaded_files.append(single_file_name)
                        new_url = f"xxx/{single_file_name}"
                        update_def_url(def_id, new_url)
                        os.remove(single_file_name)

            return jsonify({"code": 0})

    except Exception as e:
        # rollback database update
        db.session.rollback()

        # rollback the uploaded images
        for file in uploaded_files:
            try:
                s3.Object('xxx', file).delete()
            except Exception as s3_e:
                app.logger.error(f"Failed to delete S3 object {file}: {s3_e}")

        return jsonify({"code": 1})


# run when the server start
with app.app_context():

    global detector
    detector = Detector(model_path='static/faster-rcnn', device_name='cpu',
                            device_id=0)


if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000)
