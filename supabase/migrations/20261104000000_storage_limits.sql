-- AfikAccounting — upload limits enforced by Storage itself, not only by the
-- file pickers' `accept`: a type or size outside these lists is refused at
-- upload, whoever sends it. Only admins can upload (see the bucket policies).
--
-- No SVG or HTML: the media bucket is public, and either can carry script.
-- text/plain stays for files the browser can't type (an upload with no type
-- arrives as text/plain).

update storage.buckets
set file_size_limit = 524288000, -- 500 MB: lesson recordings
    allowed_mime_types = array[
      'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'text/csv', 'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
where id = 'media';

update storage.buckets
set file_size_limit = 524288000, -- 500 MB: solution videos
    allowed_mime_types = array[
      'application/pdf',
      'video/mp4', 'video/webm',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'exams';
