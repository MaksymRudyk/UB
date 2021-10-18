--############## start script for connection "main" #######
/*
 $$$$$$$$$$$ Attantion! Achtung! Vnimanie!


Attempt to alter a column req_reqList.mi_data_id as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column req_reqList.mi_dateFrom as (typeChanged: false, sizeChanged: false, allowNullChanged: true
Attempt to alter a column req_reqList.mi_dateTo as (typeChanged: false, sizeChanged: false, allowNullChanged: true
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

 
-- Add columns
--######################################
ALTER TABLE req_subDepart ADD mi_deleteDate DATETIME DEFAULT ('9999-12-31') NULL;
--
ALTER TABLE req_subDepart ADD mi_deleteUser BIGINT NULL;
--
 
-- ! update values for known or estimated changes
--######################################
update req_reqList set mi_data_id = ID where mi_data_id is null;
--
update req_reqList set mi_dateFrom = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') where mi_dateFrom is null;
--
update req_reqList set mi_dateTo = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') where mi_dateTo is null;
--
update uba_role set description_uk = ID where description_uk is null;
--
update uba_subject set name_uk = ID where name_uk is null;
--
update ubs_settings set name_uk = ID where name_uk is null;
--
 
-- Create indexes
--######################################
CREATE INDEX IDX_REQ_SUBDEPART_MI_DELETEUSER ON req_subDepart(MI_DELETEUSER) ;
--