create database if not exists RDD;
use RDD;

create table def
(
    id           int auto_increment
        primary key,
    img_id       int                    not null,
    img_url      varchar(255)           not null,
    coord_left   int                    not null,
    coord_top    int                    not null,
    coord_right  int                    not null,
    coord_bottom int                    not null,
    conf         decimal(7, 4)          not null,
    type         int                    not null,
    stat         int        default 0   not null,
    delete_flag  varchar(1) default 'N' not null,
    created_by   varchar(255)           not null,
    created_time datetime               not null,
    updated_by   varchar(255)           not null,
    updated_time datetime               not null
);

create table det
(
    id           int auto_increment
        primary key,
    img_source_url varchar(255)         not null,
    img_url      varchar(255)           null,
    latitude     decimal(7, 4)          not null,
    longitude    decimal(7, 4)          not null,
    def_num      int                    null,
    description  varchar(500) default ''        not null,
    detect_flag  varchar(1) default 'N' not null,
    delete_flag  varchar(1) default 'N' not null,
    created_by   varchar(255)           not null,
    created_time datetime               not null,
    updated_by   varchar(255)           not null,
    updated_time datetime               not null
);

# create table user
# (
#     id           int auto_increment
#         primary key,
#     username     varchar(128)  not null,
#     password     varchar(32)   not null,
#     email        varchar(128)  not null,
#     level        int default 3 not null,
#     created_time datetime      not null,
#     updated_time datetime      not null,
#     constraint email
#         unique (email),
#     constraint username
#         unique (username)
# )
;