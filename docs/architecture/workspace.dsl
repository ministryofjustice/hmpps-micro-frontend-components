workspace {
    model {

        user = person " Prison Staff User" "Someone who needs access to prisoner information to carry out their duties"
        
        microFrontendComponents = softwareSystem "HMPPS Micro frontends component service" {
            tags "HMPPS Digital Service" 
            componentApiService = container "hmpps micro-frontend API service"
        }

        HMPPSDigitalServices = softwareSystem "HMPPS Digital Services" {
            tags "HMPPS Digital Service" 
            DigitalPrisonServices = container "Digital Prison Services"
        }

        HMPPSAuth = softwareSystem "HMPPS Auth" "Authentication and Authorization server"{
            tags "HMPPS Digital Service" 
            tokenVerificationAPI = container "Token Verification API"
        }

        NOMIS = softwareSystem "NOMIS" {
            tags "Legacy System"
            prisonApi = container "Prison API"
            database  = container "NOMIS DB"

            prisonApi -> database "reads"
        }

        user -> DigitalPrisonServices "uses"
        DigitalPrisonServices -> microFrontendComponents "consume"
        microFrontendComponents -> prisonApi "describes user"
        microFrontendComponents -> tokenVerificationAPI "verifies token"

    }
    views {

        systemContext microFrontendComponents "MicroFrontEndComponents" {
            include *
            autoLayout
        }


        container NOMIS "NOMIS" {
            include *
            autoLayout
        }

        container HMPPSDigitalServices "HMPPSDigitalServices" {
            include *
            autoLayout
        }


    styles {

            element "Software System" {
                background #1168bd
                color #ffffff
            }

            element "Legacy System" {
                background #cccccc
                color #000000
            }  
            element "External System" {
                background #3598EE
                color #000000
            }             
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }
        
        }
    }
}