<% if (conn.dialect.startsWith('Oracle')) { %>
create table ub_migration(
 ID NUMBER(19) not null,
 modelName NVARCHAR2(32) not null,
 filePath NVARCHAR2(256) not null,
 fileSha NVARCHAR2(64) not null,
 appliedAt DATE default CAST(sys_extract_utc(SYSTIMESTAMP) AS DATE) not null
);
--
alter table ub_migration add constraint PK_UB_MIGRATION PRIMARY KEY (ID);
--
<% } else if (conn.dialect.startsWith('MSSQL')) { %>
create table dbo.ub_migration(
	ID BIGINT not null,
	modelName NVARCHAR(32) not null,
	filePath NVARCHAR(256) not null,
	fileSha NVARCHAR(64) not null,
	appliedAt DATETIME not null CONSTRAINT ub_migration_APPLIEDAT_DEF  default getutcdate()
);
--
alter table dbo.ub_migration add constraint PK_UB_MIGRATION PRIMARY KEY CLUSTERED(ID);
--
<% } else if (conn.dialect.startsWith('Postgre')) { %>
create table ub_migration(
	ID BIGINT not null,
	modelName VARCHAR(32) not null,
	filePath VARCHAR(256) not null,
	fileSha VARCHAR(64) not null,
	appliedAt TIMESTAMP default timezone('utc'::text, now()) not null
);
--
alter table ub_migration add constraint PK_UB_MIGRATION PRIMARY KEY (ID);
--
<% } else { %>
CREATE TABLE ub_migration (
	ID BIGINT NOT NULL PRIMARY KEY,
	modelName VARCHAR(32) NOT NULL, --Model code
	filePath VARCHAR(256) NOT NULL, --file path (relative to model _migrate folder)
	fileSha VARCHAR(64) NOT NULL, --SHA256 of file
	appliedAt DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL --Applied at
);
--
<% } %>