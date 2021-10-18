--############## start script for connection "main" #######
/*
 $$$$$$$$$$$ Attantion! Achtung! Vnimanie!


Attempt to alter a column req_reqList.mi_data_id as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column req_reqList.mi_dateFrom as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column req_reqList.mi_dateTo as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column req_subDepart.mi_deleteDate as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column uba_role.description_uk as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column uba_subject.name as (typeChanged: false, sizeChanged: true, allowNullChanged: false
Attempt to alter a column uba_subject.name_uk as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column uba_user.trustedIP as (typeChanged: false, sizeChanged: true, allowNullChanged: false
Attempt to alter a column uba_usercertificate.certParsed as (typeChanged: true, sizeChanged: false, allowNullChanged: false
Attempt to alter a column ubm_query.ubql as (typeChanged: true, sizeChanged: false, allowNullChanged: false
Attempt to alter a column ubm_sysdictionary.ubql as (typeChanged: true, sizeChanged: false, allowNullChanged: false
Attempt to alter a column ubs_settings.name_uk as (typeChanged: false, sizeChanged: false, allowNullChanged: true

 $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ 
*/

 
-- Create tables
--######################################
CREATE TABLE req_cityRegion (
	ID BIGINT NOT NULL PRIMARY KEY,
	name VARCHAR(255) NOT NULL --Region name
);
--
CREATE TABLE req_city_region_map (
	sourceID BIGINT NOT NULL,
	destID BIGINT NOT NULL
 ,CONSTRAINT PK_req_city_region_map PRIMARY KEY ( sourceID,destID) 
	, CONSTRAINT FK_REQ_CITY_REGION_MAP_SOURCEID_REF_REQ FOREIGN KEY (SOURCEID) REFERENCES req_reqList(ID)	
	, CONSTRAINT FK_REQ_CITY_REGION_MAP_DESTID_REF_ FOREIGN KEY (DESTID) REFERENCES req_cityRegion(ID)	
);
--
 
-- ! update values for known or estimated changes
--######################################
update req_reqList set mi_data_id = ID where mi_data_id is null;
--
update req_reqList set mi_dateFrom = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') where mi_dateFrom is null;
--
update req_reqList set mi_dateTo = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') where mi_dateTo is null;
--
update req_subDepart set mi_deleteDate = '9999-12-31' where mi_deleteDate is null;
--
update uba_role set description_uk = ID where description_uk is null;
--
update uba_subject set name_uk = ID where name_uk is null;
--
update ubs_settings set name_uk = ID where name_uk is null;
--
 
-- Create indexes
--######################################
CREATE UNIQUE INDEX UIDX_REQ_CITYREGION_NAME ON req_cityRegion(NAME) ;
--
CREATE INDEX IDX_req_city_region_map_DESTID ON req_city_region_map(DESTID) ;
--