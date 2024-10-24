
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
import json
import threading
app = Flask(__name__)
db = SQLAlchemy()
def get_secret():

    secret_name = "secret_name"
    region_name = "region_name"

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
                    region_name='region_name'
                    )


sqs = boto3.client('sqs',region_name='region_name')

# SQS queue URL
queue_url = 'sqs_url'
def update_det(id,new_url,def_num,session):
    det = Det.query.get(id)
    det.img_url = new_url
    det.def_num = def_num
    det.detect_flag = 'Y'
    det.updated_by = "RDD inference engine"
    det.updated_time = datetime.now()
    session.flush()
def update_det_url(id,new_url,session):
    det = Det.query.get(id)
    det.img_url = new_url
    det.updated_time = datetime.now()
    session.flush()
def update_def_url(id,new_url,session):
    defect = Def.query.get(id)
    defect.img_url = new_url
    defect.updated_time = datetime.now()
    session.flush()

def insert_det(img_source_url,latitude,longitude,created_by,session):
    det = Det(
               img_source_url=img_source_url,
                latitude=float(latitude),
                longitude=float(longitude),
                detect_flag='N',
                delete_flag='N',
                created_by=created_by,
                created_time = datetime.now(),
                updated_by = "RDD inference engine",
                updated_time = datetime.now()
            )
    session.add(det)
    session.flush()
    return det.id
def insert_def(data,session):
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
    session.add(new_def)
    session.flush()
    return new_def.id
def delete_det(id,session):
    det = Det.query.get(id)
    if det:
        session.delete(det)
        session.flush()
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

def process_sqs_messages():
    with app.app_context():
        while True:
            try:
                session = db.session
                response = sqs.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=1,
                    WaitTimeSeconds=10
                )
                messages = response.get('Messages', [])
                if not messages:
                    continue

                for message in messages:
                    receipt_handle = message['ReceiptHandle']
                    body = json.loads(message['Body'])
                    print(body)
                    res = detect(body['imageSourceUrl'],body['latitude'],body['longitude'],body['createdBy'],session)
                    if res == "success":
                        sqs.delete_message(
                            QueueUrl=queue_url,
                            ReceiptHandle=receipt_handle
                        )
            except Exception as e:
                print(f"Error processing SQS message: {e}")
                sqs.delete_message(
                    QueueUrl=queue_url,
                    ReceiptHandle=receipt_handle
                )

def detect(img_source_url,latitude,longitude,created_by,session):
    uploaded_files = []  # record the uploaded images to S3
    try:
        with session.begin():
            img_id = insert_det(img_source_url,latitude,longitude,created_by,session)

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
                [left, top, right, bottom], score = bbox[0:4].astype(int), bbox[4]
                if score < 0.75:
                    continue
                
                coords.append([left, top, right, bottom])
                scores.append(float(score))
                cat_id.append(label_id)

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
                    def_id = insert_def(defect,session)

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
                    s3.Bucket('bucket_name').upload_file(single_file_name, single_file_name,
                                                            ExtraArgs={'ACL': 'public-read'})
                    uploaded_files.append(single_file_name)
                    new_url = f"https://bucket_url/{single_file_name}"
                    update_def_url(def_id, new_url,session)
                    os.remove(single_file_name)

                cv2.imwrite(file_name, img)
                s3.Bucket('bucket_name').upload_file(file_name, file_name, ExtraArgs={'ACL': 'public-read'})
                uploaded_files.append(file_name)
                new_url = f"https://bucket_url/{file_name}"
                update_det(img_id, new_url, len(cat_id),session)
                os.remove(file_name)

                return "success"
            else:
                delete_det(img_id,session)
                s3.Object('bucket_name', origion_source_name).delete()
                return "success"

    except Exception as e:
        # rollback database update
        print(e)
        db.session.rollback()
        delete_det(img_id,session)
        # rollback the uploaded images
        for file in uploaded_files:
            try:
                s3.Object('bucket_name', file).delete()
            except Exception as s3_e:
                app.logger.error(f"Failed to delete S3 object {file}: {s3_e}")

        return "failed"
    finally:
        session.remove()

@app.route('/ml/health', methods=['GET'])
def health_check():
    response = app.response_class(
        response=json.dumps({"status": "healthy"}),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/ml/update_img', methods=['POST'])
def draw_img():
    uploaded_files = [] # record the uploaded images to S3
    session = db.session
    try:
        with session.begin():
            # get the original image
            data = request.json
            img_id = data.get('id')
            def_id = data.get('def_id')
            img_source_url = get_img_source_url(img_id)
            img_url = get_img_url(img_id)
            origion_name = os.path.basename(img_url)

            s3.Object('bucket_name', origion_name).delete()

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
                s3.Bucket('bucket_name').upload_file(file_name, file_name, ExtraArgs={'ACL': 'public-read'})
                uploaded_files.append(file_name)
                new_url = f"https://bucket_url/{file_name}"
                update_det_url(img_id, new_url,session)
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
                        s3.Bucket('bucket_name').upload_file(single_file_name, single_file_name, ExtraArgs={'ACL': 'public-read'})
                        uploaded_files.append(single_file_name)
                        new_url = f"https://bucket_url/{single_file_name}"
                        update_def_url(def_id, new_url,session)
                        os.remove(single_file_name)

            return jsonify({"code": 0})

    except Exception as e:
        # rollback database update
        db.session.rollback()
        # rollback the uploaded images
        for file in uploaded_files:
            try:
                s3.Object('bucket_name', file).delete()
            except Exception as s3_e:
                app.logger.error(f"Failed to delete S3 object {file}: {s3_e}")

        return jsonify({"code": 1})


with app.app_context():
    global detector
    detector = Detector(model_path='model/path', device_name='cpu',
                            device_id=0)
    sqs_thread1 = threading.Thread(target=process_sqs_messages, daemon=True)
    sqs_thread1.start()
    sqs_thread2 = threading.Thread(target=process_sqs_messages, daemon=True)
    sqs_thread2.start()

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000)
