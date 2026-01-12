from login import get_login

TEST_PATIENT = {"email": "stefanshabbir@gmail.com", "password": "123456789"}
TEST_DOCTOR = {"email": "hinoseb173@alexida.com", "password": "123456789"}

driver = get_login(TEST_PATIENT["email"], TEST_PATIENT["password"])
# driver = get_login(TEST_DOCTOR["email"], TEST_DOCTOR["password"])