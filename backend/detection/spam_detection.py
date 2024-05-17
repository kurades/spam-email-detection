import sys
import json
import re
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from nltk.corpus import stopwords

cv_file = "detection/cv.pkl"
svm_file = 'detection/svm_model.pkl'
nb_file = 'detection/nb_model.pkl'
rf_file = 'rf_model.pkl'
lr_file = 'lr_model.pkl'
# Load the pre-trained model and the vectorizer
cv = pickle.load(open(cv_file, 'rb'))
model = pickle.load(open(nb_file, 'rb'))
stop_words = set(stopwords.words('english'))
# vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))

# Remove punctuation and convert to lowercase

# loaded_svm_model = pickle.load(open(svm_file, 'rb'))
# loaded_nb_model = pickle.load(open(nb_file, 'rb'))
# loaded_rf_model = pickle.load(open(rf_file, 'rb'))
# loaded_lr_model = pickle.load(open(lr_file, 'rb'))

def predict_spam(email):
    # Vectorize the email text
    text = re.sub(r'[^\w\s]', '', email.lower())
    # Remove stop words
    filtered_text = ' '.join(word for word in text.split() if word not in stop_words)
    transform = cv.transform([filtered_text])

    # email_vector = vectorizer.transform([email])
    # Predict using the loaded model
    prediction = model.predict(transform)
    return prediction[0]

if __name__ == "__main__":
    # Read email content from the first command-line argument
    email_content = sys.argv[1]
    # Predict and print the result
    result = predict_spam(email_content)

    print(result)
