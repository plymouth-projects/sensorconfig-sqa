CREATE DATABASE aqm;

use aqm;

SHOW tables;

select * from users;

select * from sensors;

delete from sensors where id >= 6;

select * from readings;

select * from simulation_configs;

delete from readings where id >=1;