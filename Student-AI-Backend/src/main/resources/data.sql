INSERT INTO users (id, email, password, name, role) VALUES
(1, 'rinky@gmail.com', '$2a$12$TskceGisH25fkXf8pBe6TuyeHytZUbp1ViDurFGySMMpblFncBdpG', 'Rinky Dubey', 'TEACHER'),
(2, 'john@gmail.com',  '$2a$12$TskceGisH25fkXf8pBe6TuyeHytZUbp1ViDurFGySMMpblFncBdpG', 'John Dubey',  'TEACHER'),
(3, 'rakesh@gmail.com','$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Rakesh Kumar','STUDENT'),
(4, 'amit@gmail.com',  '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Amit Singh',  'STUDENT'),
(5, 'neha@gmail.com',  '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Neha Verma',  'STUDENT'),
(6, 'priya@gmail.com', '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Priya Patel', 'STUDENT'),
(7, 'karan@gmail.com', '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Karan Mehta', 'STUDENT'),
(8, 'sneha@gmail.com', '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Sneha Iyer',  'STUDENT'),
(9, 'arjun@gmail.com', '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Arjun Reddy', 'STUDENT'),
(10,'vikas@gmail.com', '$2a$12$/jg/ER.e/X0uHU30pyiKSesIdm/.fYEnD9jzn49dnWkaG9wq4Hhe2', 'Vikas Yadav', 'STUDENT')
ON CONFLICT (id) DO NOTHING;

-- user_id matches the users table above (rakesh=3, amit=4, neha=5 ... vikas=10)
-- student id restarted from 1 to keep it clean
INSERT INTO students (id, name, email, enrollment_number, department, semester, user_id) VALUES
(1, 'Rakesh Kumar', 'rakesh@gmail.com', 'CSE-001', 'CSE', 3, 3),
(2, 'Amit Singh',   'amit@gmail.com',   'CSE-002', 'CSE', 3, 4),
(3, 'Neha Verma',   'neha@gmail.com',   'CSE-003', 'CSE', 3, 5),
(4, 'Priya Patel',  'priya@gmail.com',  'CSE-004', 'CSE', 3, 6),
(5, 'Karan Mehta',  'karan@gmail.com',  'CSE-005', 'CSE', 3, 7),
(6, 'Sneha Iyer',   'sneha@gmail.com',  'CSE-006', 'CSE', 3, 8),
(7, 'Arjun Reddy',  'arjun@gmail.com',  'CSE-007', 'CSE', 3, 9),
(8, 'Vikas Yadav',  'vikas@gmail.com',  'CSE-008', 'CSE', 3, 10)
ON CONFLICT (id) DO NOTHING;

INSERT INTO marks (student_id, subject, score, max_score, exam_type) VALUES
(1,'DSA',30,100,'MIDTERM'),(1,'Science',25,100,'MIDTERM'),
(2,'DSA',85,100,'MIDTERM'),(2,'Science',78,100,'MIDTERM'),
(3,'DSA',55,100,'MIDTERM'),(3,'Science',45,100,'MIDTERM'),
(4,'DSA',90,100,'MIDTERM'),(4,'Science',88,100,'MIDTERM'),
(5,'DSA',20,100,'MIDTERM'),(5,'Science',30,100,'MIDTERM'),
(6,'DSA',65,100,'MIDTERM'),(6,'Science',60,100,'MIDTERM'),
(7,'DSA',50,100,'MIDTERM'),(7,'Science',55,100,'MIDTERM'),
(8,'DSA',35,100,'MIDTERM'),(8,'Science',20,100,'MIDTERM')
ON CONFLICT DO NOTHING;

INSERT INTO attendance (student_id, subject, month, year, classes_held, classes_attended) VALUES
(1,'DSA',4,2026,30,10),
(2,'DSA',4,2026,30,28),
(3,'DSA',4,2026,30,22),
(4,'DSA',4,2026,30,29),
(5,'DSA',4,2026,30,8),
(6,'DSA',4,2026,30,24),
(7,'DSA',4,2026,30,21),
(8,'DSA',4,2026,30,15)
ON CONFLICT DO NOTHING;

INSERT INTO assignments (student_id, subject, title, score, max_score, status) VALUES
(1,'DSA','A1',20,100,'NOT_SUBMITTED'),
(2,'DSA','A1',90,100,'SUBMITTED_ON_TIME'),
(3,'DSA','A1',55,100,'SUBMITTED_LATE'),
(4,'DSA','A1',95,100,'SUBMITTED_ON_TIME'),
(5,'DSA','A1',30,100,'NOT_SUBMITTED'),
(6,'DSA','A1',65,100,'SUBMITTED_ON_TIME'),
(7,'DSA','A1',50,100,'SUBMITTED_LATE'),
(8,'DSA','A1',25,100,'NOT_SUBMITTED')
ON CONFLICT DO NOTHING;

INSERT INTO study_sessions (student_id, subject, hours_studied, revision_session) VALUES
(1,'DSA',5,false),
(2,'DSA',15,true),
(3,'DSA',8,false),
(4,'DSA',18,true),
(5,'DSA',4,false),
(6,'DSA',11,true),
(7,'DSA',9,false),
(8,'DSA',6,false)
ON CONFLICT DO NOTHING;

INSERT INTO engagement_logs (student_id, login_count, session_duration_minutes, materials_accessed, lecture_completion_rate) VALUES
(1,10,200,15,70),
(2,12,250,18,75),
(3,5,100,5,40),
(4,20,400,30,90),
(5,11,220,12,65),
(6,25,450,35,95),
(7,4,80,3,30),
(8,13,260,20,78)
ON CONFLICT DO NOTHING;