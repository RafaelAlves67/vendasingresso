export function validateCEP(cep){
    const cepRegex = /^[0-9]{5}-[0-9]{3}$/;
    return cepRegex.test(cep)
        
}