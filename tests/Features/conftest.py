import config
import pytest

from login import get_driver, login


@pytest.fixture(scope="function")
def driver():
    """
    Create and yield a webdriver instance. Always quit at teardown.
    """
    drv = get_driver(headless=True)  # set True for CI/headless runs
    yield drv
    try:
        drv.quit()
    except Exception:
        pass

@pytest.fixture(scope="function")
def patient_login(driver):
    """
    Log in using credentials from config.py and yield the driver.
    """
    login(driver, config.BASE_URL, config.PATIENT_EMAIL, config.UNIVERSAL_PASSWORD)
    yield driver

@pytest.fixture(scope="function")
def doctor_login(driver):
    """
    Log in using credentials from config.py and yield the driver.
    """
    login(driver, config.BASE_URL, config.DOCTOR_EMAIL, config.UNIVERSAL_PASSWORD)
    yield driver
