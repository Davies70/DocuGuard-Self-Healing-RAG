# --- SCENARIO DATA (Strategy 3: Realistic Excerpts) ---
SCENARIOS = {
    "stripe": {
        "doc_a": """
        STRIPE API REFERENCE v2020-08-27
        SECTION: CHARGES
        
        To charge a credit card or other payment source, you create a Charge object. 
        If your API key is in test mode, the supplied payment source (e.g., card) won't actually be charged, 
        although everything else will occur as if in live mode.
        
        POST /v1/charges
        
        REQUIRED PARAMETERS:
        - amount: A positive integer representing how much to charge.
        - currency: Three-letter ISO currency code, in lowercase.
        - source: A payment source to be charged. This can be the ID of a card (i.e., credit card), 
          a bank account, or a token source.
        """,
        
        "doc_b": """
        STRIPE API CHANGELOG v2024-01-01
        TOPIC: MIGRATING TO PAYMENT INTENTS
        
        BREAKING CHANGES:
        
        1. Legacy Charges API Deprecation:
        The direct /v1/charges endpoint is now deprecated and should not be used for new integrations. 
        Attempting to use the 'source' parameter on new accounts will result in a 400 Bad Request error.
        
        2. New Standard: PaymentIntents:
        You must now use the PaymentIntents API (/v1/payment_intents) for all payments. 
        This API creates a PaymentIntent object to track the lifecycle of a payment from creation to confirmation.
        
        Migration Path:
        Replace all calls to `stripe.charges.create` with `stripe.paymentIntents.create`.
        """
    },
    "react": {
        "doc_a": """
        REACT DOM DOCUMENTATION v17.0.2
        Event Delegation Model
        
        In React 17, React attaches event listeners to the root document of the page.
        This means that when you stop propagation on a synthetic event (e.g., e.stopPropagation()), 
        it stops propagation at the document level.
        
        Example:
        document.addEventListener('click', ...)
        """,
        
        "doc_b": """
        REACT DOM CHANGELOG v18.0.0
        Breaking Change: Event Delegation
        
        In React 18, we have changed how events are delegated.
        React will no longer attach event listeners to the root document. 
        Instead, it will attach them to the root DOM container (e.g., the div with id="root") where your React tree is mounted.
        
        Impact:
        This change may affect how e.stopPropagation() works if you are mixing React and non-React code.
        """
    },
    "nextjs": {
        "doc_a": """
        NEXT.JS DOCUMENTATION v12
        Data Fetching (Pages Directory)
        
        To fetch data at build time, export an async function called 'getStaticProps' from your page file.
        To fetch data on each request, export an async function called 'getServerSideProps'.
        
        These functions only work inside the 'pages' directory.
        """,
        
        "doc_b": """
        NEXT.JS APP ROUTER MIGRATION GUIDE (v14)
        
        The 'pages' directory is now considered legacy. New projects should use the 'app' directory.
        
        Breaking Changes:
        - 'getStaticProps' and 'getServerSideProps' are not supported in the 'app' directory.
        - Instead, simply mark your component as 'async' and use standard 'fetch()' calls directly inside the component.
        - Route handlers have replaced API routes.
        """
    },
    "aws_s3": {
        "doc_a": """
        AWS SDK FOR JAVASCRIPT v2
        Service: S3
        
        To upload a file to S3, instantiate the service and call the upload method.
        
        var s3 = new AWS.S3();
        var params = {Bucket: 'bucket', Key: 'key', Body: stream};
        s3.upload(params, function(err, data) {
          console.log(err, data);
        });
        """,
        
        "doc_b": """
        AWS SDK FOR JAVASCRIPT v3
        MIGRATION GUIDE
        
        The AWS SDK v3 is modularized. There is no global AWS namespace.
        
        Breaking Changes:
        - You must import specific commands: import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
        - Callback style is no longer supported. You must use async/await or .then().
        - The '.upload()' convenience method is removed from the core client; use 'PutObjectCommand' or 'lib-storage' instead.
        """
    },
    "python": {
        "doc_a": """
        PYTHON 2.7 DOCUMENTATION
        The print statement
        
        In Python 2, 'print' is a statement, not a function.
        You do not need parentheses.
        
        Example:
        print "Hello World"
        print "The answer is", 42
        """,
        
        "doc_b": """
        PYTHON 3.0 RELEASE NOTES
        What's New In Python 3.0
        
        The print statement has been replaced with a print() function, with keyword arguments to replace most of the special syntax of the old print statement.
        
        Breaking Change:
        The syntax `print "Hello World"` is now invalid and will raise a SyntaxError.
        You must write `print("Hello World")`.
        """
    },
    "openai": {
        "doc_a": """
        OPENAI PYTHON LIBRARY v0.28
        Chat Completion
        
        To generate a chat response, use the static creation method on the global class:
        
        import openai
        openai.api_key = "..."
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello!"}]
        )
        """,
        
        "doc_b": """
        OPENAI PYTHON LIBRARY v1.0.0 (BETA)
        Migration Guide
        
        The v1.0.0 library is a total rewrite. The global 'openai' object configuration is removed.
        
        New Usage:
        You must instantiate a client object.
        
        from openai import OpenAI
        client = OpenAI(api_key="...")
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[...]
        )
        """
    },
    "tailwind": {
        "doc_a": """
        TAILWIND CSS v2.0
        Dark Mode Configuration
        
        To enable dark mode, set the 'darkMode' option in your tailwind.config.js file to 'media' or 'class'.
        
        // tailwind.config.js
        module.exports = {
          darkMode: 'media', // or 'class'
          // ...
        }
        """,
        
        "doc_b": """
        TAILWIND CSS v3.4 RELEASE NOTES
        
        We have simplified the dark mode configuration.
        The 'media' strategy is now the default if no option is provided.
        
        Deprecation:
        The 'class' strategy is deprecated in favor of 'selector'.
        
        // tailwind.config.js
        module.exports = {
          darkMode: 'selector', // replaces 'class'
        }
        """
    },
    "kubernetes": {
        "doc_a": """
        KUBERNETES v1.20 DOCUMENTATION
        Container Runtimes
        
        Kubernetes supports Docker via the "Dockershim" bridge.
        You can use Docker Engine directly as your container runtime.
        The kubelet will automatically detect Docker and use it.
        """,
        
        "doc_b": """
        KUBERNETES v1.24 CHANGELOG
        Removal of Dockershim
        
        Breaking Change:
        The Dockershim component has been removed from the kubelet in Kubernetes v1.24.
        
        Impact:
        You can no longer use Docker Engine as a container runtime.
        You must switch to a CRI-compliant runtime like containerd or CRI-O.
        """
    },
    "github_actions": {
        "doc_a": """
        GITHUB ACTIONS v1
        Workflow Commands
        
        To set an output parameter for a step, use the specific echo format:
        
        run: echo "::set-output name=action_status::success"
        """,
        
        "doc_b": """
        GITHUB ACTIONS CHANGELOG (Oct 2022)
        Deprecation of save-state and set-output commands
        
        The `::set-output` command is deprecated and will be disabled soon due to security vulnerabilities (CWE-78).
        
        New Syntax:
        You should write to the `$GITHUB_OUTPUT` environment file instead.
        
        run: echo "action_status=success" >> $GITHUB_OUTPUT
        """
    },
    "flutter": {
        "doc_a": """
        FLUTTER SDK v2.0
        Navigation Interception
        
        To intercept the back button on Android, wrap your widget in a WillPopScope widget.
        
        return WillPopScope(
          onWillPop: () async => false,
          child: Scaffold(...),
        );
        """,
        
        "doc_b": """
        FLUTTER SDK v3.12
        Predictive Back Navigation
        
        Breaking Change:
        WillPopScope is now deprecated to support Android 14's predictive back gesture.
        
        Migration:
        Use the new `PopScope` widget instead.
        The `onWillPop` callback is replaced by `canPop` (boolean) and `onPopInvoked` (callback).
        """
    }
}