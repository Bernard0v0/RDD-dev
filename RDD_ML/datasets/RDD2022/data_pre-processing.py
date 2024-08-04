import os
import tqdm
import random

path = 'train/'
files = os.listdir(path + 'images/')
for file in tqdm.tqdm(files):
    if random.random() < 0.8:
        with open(path+'train.txt', 'a') as f:
            f.write(file[:-4] + '\n')
    else:
        with open(path + 'val.txt', 'a') as f:
            f.write(file[:-4] + '\n')