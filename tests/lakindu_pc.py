from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BROWSER_PATH = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" 

def get_driver() -> webdriver.Chrome:
    chrome_options = webdriver.ChromeOptions()
    chrome_options.binary_location = BROWSER_PATH
    chrome_options.add_experimental_option("detach", True) 
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def login(type:str, email:str=None, password:str=None) -> webdriver.Chrome:
    driver = get_driver()
    driver.get("https://medi-follow.vercel.app/login") 
    
    if type.lower() == "patient":
        print(f"Logging in as {type}...")
        try:
            username_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email")) 
            )

            if email:
                username_field.send_keys(email)
            else:
                username_field.send_keys("stefanshabbir@gmail.com")

            password_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "password"))
            )

            if password:
                password_field.send_keys(password)
            else:
                password_field.send_keys("123456789")

            driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

            WebDriverWait(driver, 15).until(EC.title_is("MediFollow - Healthcare Management Platform"))
            print(f"Login successful as {type}! Page title is:", driver.title)
        except Exception as e:
            print(f"An error occurred during login as {type}: {e}")
        finally:
            pass # Keep browser open for viewing, close manually
    elif type.lower() == "doctor":
        print(f"Logging in as {type}...")
        try:
            username_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email")) 
            )

            if email:
                username_field.send_keys(email)
            else:
                username_field.send_keys("hinoseb173@alexida.com")

            password_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "password"))
            )

            if password:
                password_field.send_keys(password)
            else:
                password_field.send_keys("123456789")

            driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

            WebDriverWait(driver, 15).until(EC.title_is("MediFollow - Healthcare Management Platform"))
            print(f"Login successful as {type}! Page title is:", driver.title)
        except Exception as e:
            print(f"An error occurred during login as {type}: {e}")
        finally:
            pass # Keep browser open for viewing, close manually
    else:
        print("Invalid user type specified. Please use 'patient' or 'doctor'.")

    return driver